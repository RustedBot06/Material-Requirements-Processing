import os
import sys
import shutil
import tempfile
import unittest
import sqlite3
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import config

class ChipsMRPComprehensiveIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create a temporary copy of chips_mrp.db for isolated, safe end-to-end testing
        cls.temp_dir = tempfile.mkdtemp()
        cls.test_db_path = Path(cls.temp_dir) / "test_chips_mrp.db"
        shutil.copyfile(config.DB_PATH, cls.test_db_path)

        # Point config.DB_PATH to the test copy
        cls.orig_db_path = config.DB_PATH
        config.DB_PATH = cls.test_db_path

        # Import Flask app and test client
        from app import create_app
        cls.app = create_app()
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        # Restore original DB path and clean up temp files
        config.DB_PATH = cls.orig_db_path
        try:
            shutil.rmtree(cls.temp_dir)
        except Exception:
            pass

    # 1. System Health & Database Preservation
    def test_01_health_and_existing_data_intact(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database"]["compatible"])

        # Check existing materials, products, bom, and schedules
        resp_m = self.client.get("/api/materials")
        self.assertEqual(resp_m.status_code, 200)
        mats = resp_m.get_json()
        self.assertGreaterEqual(len(mats), 4)

        resp_p = self.client.get("/api/products")
        self.assertEqual(resp_p.status_code, 200)
        prods = resp_p.get_json()
        self.assertGreaterEqual(len(prods), 3)

        resp_s = self.client.get("/api/schedule")
        self.assertEqual(resp_s.status_code, 200)
        schedules = resp_s.get_json()
        self.assertGreaterEqual(len(schedules), 5)

    # 2. Raw Materials CRUD & Validation
    def test_02_materials_crud(self):
        # Create new test material
        payload = {
            "material_name": "Special Spice Blend",
            "unit": "kg",
            "stock_qty": 50.0,
            "cost_per_unit": 120.0,
            "min_stock_threshold": 15.0
        }
        res = self.client.post("/api/materials", json=payload)
        self.assertEqual(res.status_code, 201)
        created_id = res.get_json()["id"]

        # Read back
        res_get = self.client.get(f"/api/materials/{created_id}")
        self.assertEqual(res_get.status_code, 200)
        item = res_get.get_json()
        self.assertEqual(item["material_name"], "Special Spice Blend")
        self.assertEqual(float(item["stock_qty"]), 50.0)
        self.assertEqual(float(item["available_qty"]), 50.0)
        self.assertEqual(float(item["min_stock_threshold"]), 15.0)
        self.assertFalse(item["is_low_stock"])

        # Update
        update_payload = {
            "material_name": "Special Seasoning Powder",
            "unit": "kg",
            "stock_qty": 45.0,
            "cost_per_unit": 125.0,
            "min_stock_threshold": 20.0
        }
        res_put = self.client.put(f"/api/materials/{created_id}", json=update_payload)
        self.assertEqual(res_put.status_code, 200)

        # Delete
        res_del = self.client.delete(f"/api/materials/{created_id}")
        self.assertEqual(res_del.status_code, 200)

        # Verify not found
        res_404 = self.client.get(f"/api/materials/{created_id}")
        self.assertEqual(res_404.status_code, 404)

    # 3. Product CRUD & Foreign Key Integrity
    def test_03_products_crud_and_bom_protection(self):
        # Create test product
        p_payload = {
            "name": "Barbeque Crunch",
            "packet_size": 30,
            "stock_qty": 200,
            "mrp": 15.0
        }
        res = self.client.post("/api/products", json=p_payload)
        self.assertEqual(res.status_code, 201)
        prod_id = res.get_json()["id"]

        # Update product
        res_put = self.client.put(f"/api/products/{prod_id}", json={
            "name": "Smoky Barbeque Crunch",
            "packet_size": 30,
            "stock_qty": 250,
            "mrp": 15.0
        })
        self.assertEqual(res_put.status_code, 200)

        # Existing product ID 10 is in BOM and schedules: attempting deletion MUST fail
        res_del_blocked = self.client.delete("/api/products/10")
        self.assertEqual(res_del_blocked.status_code, 409)
        self.assertIn("Deletion Blocked", res_del_blocked.get_json()["error"])

        # Delete the newly created product (not in BOM)
        res_del = self.client.delete(f"/api/products/{prod_id}")
        self.assertEqual(res_del.status_code, 200)

    # 4. Stock Adjustments (Positive & Negative, Reason required, Atomic Movement Log)
    def test_04_stock_adjustments_and_negative_stock_prevention(self):
        # Material 14 is Salt (stock = 100 kg)
        # Increase stock by 25 kg
        inc_res = self.client.post("/api/materials/14/adjust", json={
            "adjustment_type": "INCREASE",
            "quantity": 25.0,
            "reason": "Supplier bonus pack received"
        })
        self.assertEqual(inc_res.status_code, 200)
        data = inc_res.get_json()["data"]
        self.assertEqual(float(data["previous_stock"]), 100.0)
        self.assertEqual(float(data["new_stock"]), 125.0)

        # Decrease stock by 15 kg
        dec_res = self.client.post("/api/materials/14/adjust", json={
            "adjustment_type": "DECREASE",
            "quantity": 15.0,
            "reason": "Moisture damage write-off"
        })
        self.assertEqual(dec_res.status_code, 200)
        data_dec = dec_res.get_json()["data"]
        self.assertEqual(float(data_dec["new_stock"]), 110.0)

        # Negative stock prevention: attempt to deduct 500 kg from 110 kg
        neg_res = self.client.post("/api/materials/14/adjust", json={
            "adjustment_type": "DECREASE",
            "quantity": 500.0,
            "reason": "Massive scrap"
        })
        self.assertEqual(neg_res.status_code, 400)
        self.assertIn("negative stock", neg_res.get_json()["error"].lower())

        # Verify stock remained 110.0
        check = self.client.get("/api/materials/14").get_json()
        self.assertEqual(float(check["stock_qty"]), 110.0)

        # Verify movement history was logged atomically
        mov_res = self.client.get("/api/materials/14/movements")
        self.assertEqual(mov_res.status_code, 200)
        movements = mov_res.get_json()
        reasons = [m["reason"] for m in movements]
        self.assertIn("Supplier bonus pack received", reasons)
        self.assertIn("Moisture damage write-off", reasons)

    # 5. Low-Stock Alerts & Reorder Suggestions
    def test_05_low_stock_alerts_and_reorder_suggestions(self):
        # Set min_stock_threshold of Salt (ID 14, stock 110.0) to 150.0
        self.client.put("/api/materials/14", json={
            "material_name": "Salt",
            "unit": "kg",
            "stock_qty": 110.0,
            "cost_per_unit": 18.0,
            "min_stock_threshold": 150.0
        })

        # Fetch alerts
        alerts_res = self.client.get("/api/materials/alerts")
        self.assertEqual(alerts_res.status_code, 200)
        alerts = alerts_res.get_json()
        salt_alert = next((a for a in alerts if a["material_id"] == 14), None)
        self.assertIsNotNone(salt_alert)
        self.assertEqual(float(salt_alert["min_stock_threshold"]), 150.0)
        self.assertEqual(float(salt_alert["available_qty"]), 110.0)
        self.assertEqual(float(salt_alert["deficit"]), 40.0)

        # Fetch reorder suggestions
        reorder_res = self.client.get("/api/materials/reorder-suggestions")
        self.assertEqual(reorder_res.status_code, 200)
        suggestions = reorder_res.get_json()
        salt_sugg = next((s for s in suggestions if s["material_id"] == 14), None)
        self.assertIsNotNone(salt_sugg)
        self.assertEqual(float(salt_sugg["suggested_purchase_qty"]), 40.0)
        self.assertEqual(float(salt_sugg["estimated_cost"]), 40.0 * 18.0)
        self.assertTrue(salt_sugg["reorder_needed"])

        # Verify suggestions are never negative for well-stocked items
        for s in suggestions:
            self.assertGreaterEqual(float(s["suggested_purchase_qty"]), 0.0)

    # 6. Production Reservations & Competing Schedules Prevention
    def test_06_production_reservations_and_competing_schedules(self):
        # Product 11 (Classic Salted 25g) requires 0.112 L Palm oil per pkt
        # Palm oil (ID 13) current stock is 501.0 L. Threshold is 100.0 L.
        # Active reservations currently: 0. Available = 501.0 L.

        # Schedule Run A: 2000 pkts. Required oil = 2000 * 0.112 = 224 L.
        sched_a = self.client.post("/api/schedule", json={
            "product_id": 11,
            "date": "2026-11-20",
            "planned_qty": 2000,
            "actual_qty": 0
        })
        self.assertEqual(sched_a.status_code, 201)
        sched_a_id = sched_a.get_json()["id"]

        # Verify oil reservations and available stock
        oil_info = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_info["stock_qty"]), 501.0) # Physical stock NOT deducted yet!
        self.assertEqual(float(oil_info["reserved_qty"]), 224.0)
        self.assertEqual(float(oil_info["available_qty"]), 277.0)

        # Competing Schedule Run B: 3000 pkts requires 336 L, but only 277 L is free.
        # Planning must still succeed; it is AT_RISK and must not partially reserve stock.
        sched_b = self.client.post("/api/schedule", json={
            "product_id": 11,
            "date": "2026-11-21",
            "planned_qty": 3000,
            "actual_qty": 0
        })
        self.assertEqual(sched_b.status_code, 201)
        sched_b_id = sched_b.get_json()["id"]
        self.assertEqual(sched_b.get_json()["status"], "AT_RISK")
        oil_during_b = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_during_b["reserved_qty"]), 224.0)
        with self.app.app_context():
            from database.connection import get_db
            with get_db() as conn:
                active_b = conn.execute(
                    "SELECT COUNT(*) FROM stock_reservations WHERE schedule_id = ? AND status = 'ACTIVE'",
                    (sched_b_id,),
                ).fetchone()[0]
                self.assertEqual(active_b, 0)

        # Test Schedule Cancellation & Reservation Release
        # Cancel Run A: oil reservations must be released
        cancel_res = self.client.post(f"/api/schedule/{sched_a_id}/cancel")
        self.assertEqual(cancel_res.status_code, 200)

        # Check oil available stock is restored to 501.0 L
        oil_restored = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_restored["reserved_qty"]), 0.0)
        self.assertEqual(float(oil_restored["available_qty"]), 501.0)

        # After cancelling A, explicitly reserve the already-created plan B.
        reserve_b = self.client.post(f"/api/schedule/{sched_b_id}/reserve")
        self.assertEqual(reserve_b.status_code, 200)
        self.assertEqual(reserve_b.get_json()["status"], "SCHEDULED")

        # Available oil is now 501.0 - 336 = 165.0 L
        oil_after_b = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_after_b["reserved_qty"]), 336.0)
        self.assertEqual(float(oil_after_b["available_qty"]), 165.0)

    # 7. Production Completion, Consumption & Duplicate Prevention
    def test_07_production_completion_and_duplicate_prevention(self):
        # We have sched_b_id scheduled for 3000 pkts of Product 11
        # Fetch latest schedules to find the ID
        schedules = self.client.get("/api/schedule").get_json()
        sched_run = next((s for s in schedules if s["date"] == "2026-11-21" and s["status"] == "SCHEDULED"), None)
        self.assertIsNotNone(sched_run)
        s_id = sched_run["id"]

        # Initial finished goods stock of Product 11
        prod_before = self.client.get("/api/products/11").get_json()
        p_stock_before = int(prod_before["stock_qty"])

        # Initial physical oil stock
        oil_before = self.client.get("/api/materials/13").get_json()
        oil_phys_before = float(oil_before["stock_qty"]) # 501.0

        # Complete production run with 3000 pkts
        comp_res = self.client.post(f"/api/schedule/{s_id}/complete", json={"actual_qty": 3000})
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.get_json()["data"]
        self.assertEqual(comp_data["status"], "COMPLETED")
        self.assertEqual(comp_data["actual_qty"], 3000)

        # Check physical oil stock: should be deducted by 336.0 L -> 501 - 336 = 165.0 L
        oil_after = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_after["stock_qty"]), 165.0)
        self.assertEqual(float(oil_after["reserved_qty"]), 0.0) # reservation converted to consumption!
        self.assertEqual(float(oil_after["available_qty"]), 165.0)

        # Finished goods stock should have increased by 3000 pkts
        prod_after = self.client.get("/api/products/11").get_json()
        self.assertEqual(int(prod_after["stock_qty"]), p_stock_before + 3000)

        # Duplicate Completion Prevention:
        # Calling complete on the same run MUST fail with 400
        dup_comp = self.client.post(f"/api/schedule/{s_id}/complete", json={"actual_qty": 3000})
        self.assertEqual(dup_comp.status_code, 400)
        self.assertIn("status is 'completed'", dup_comp.get_json()["error"].lower())

        # Calling cancel on a completed run MUST also fail
        dup_cancel = self.client.post(f"/api/schedule/{s_id}/cancel")
        self.assertEqual(dup_cancel.status_code, 400)

        # Verify stock movement entry recorded PRODUCTION_CONSUMPTION
        mov_res = self.client.get("/api/materials/13/movements")
        movements = mov_res.get_json()
        consumption_mov = next((m for m in movements if m["movement_type"] == "PRODUCTION_CONSUMPTION" and m["reference_id"] == s_id), None)
        self.assertIsNotNone(consumption_mov)
        self.assertEqual(float(consumption_mov["quantity"]), 336.0)

    # 8. Historical Production Cost Preservation
    def test_08_historical_production_cost_preservation(self):
        # Retrieve cost breakdown for the completed run (s_id from 2026-11-21)
        schedules = self.client.get("/api/schedule").get_json()
        sched_run = next((s for s in schedules if s["date"] == "2026-11-21" and s["status"] == "COMPLETED"), None)
        self.assertIsNotNone(sched_run)
        s_id = sched_run["id"]

        cost_breakdown_1 = self.client.get(f"/api/schedule/{s_id}/cost-breakdown").get_json()
        orig_unit_cost = float(cost_breakdown_1["unit_material_cost"])
        orig_total_cost = float(cost_breakdown_1["total_material_cost"])
        self.assertGreater(orig_total_cost, 0)

        # Oil cost per unit was 145.0. Total cost for 336 L was 336 * 145 = 48720.0
        self.assertEqual(orig_total_cost, 48720.0)

        # Now simulate market price change: Palm oil price spikes from 145.0 to 300.0 / L
        self.client.put("/api/materials/13", json={
            "material_name": "Edible oil (Palm)",
            "unit": "L",
            "stock_qty": 165.0,
            "cost_per_unit": 300.0,
            "min_stock_threshold": 100.0
        })

        # Verify current raw material unit price is indeed 300.0
        oil_mat = self.client.get("/api/materials/13").get_json()
        self.assertEqual(float(oil_mat["cost_per_unit"]), 300.0)

        # Now re-query the historical cost breakdown for the batch completed earlier
        cost_breakdown_2 = self.client.get(f"/api/schedule/{s_id}/cost-breakdown").get_json()
        frozen_unit_cost = float(cost_breakdown_2["unit_material_cost"])
        frozen_total_cost = float(cost_breakdown_2["total_material_cost"])

        # CRITICAL TEST: Changing today's raw material price MUST NOT change historical production costs!
        self.assertEqual(frozen_total_cost, orig_total_cost)
        self.assertEqual(frozen_unit_cost, orig_unit_cost)

        # Cost trends query must also reflect historical cost
        trends = self.client.get("/api/production/cost-trends").get_json()
        batch_trend = next((t for t in trends if t["schedule_id"] == s_id), None)
        self.assertIsNotNone(batch_trend)
        self.assertEqual(float(batch_trend["unit_cost"]), orig_unit_cost)

    # 9. Analytics Endpoints, Variance, Surplus/Shortfall, and Date Filtering
    def test_09_analytics_variance_and_date_filtering(self):
        # Graph 1: Production Comparison
        comp = self.client.get("/api/analytics/production-comparison").get_json()
        self.assertIn("data", comp)
        self.assertIn("summary", comp)
        self.assertGreaterEqual(len(comp["data"]), 5)

        # Date filter test
        filtered_comp = self.client.get("/api/analytics/production-comparison?start_date=2026-11-11&end_date=2026-11-12").get_json()
        dates = [d["date"] for d in filtered_comp["data"]]
        for d in dates:
            self.assertTrue("2026-11-11" <= d <= "2026-11-12")

        # Graph 2: Production Shortfall & Surplus
        shortfall = self.client.get("/api/analytics/production-shortfall").get_json()
        self.assertIn("summary", shortfall)
        for point in shortfall["data"]:
            planned = point["planned_qty"]
            actual = point["actual_qty"]
            variance = point["variance"]
            self.assertAlmostEqual(variance, actual - planned, places=2)
            if variance < 0:
                self.assertEqual(point["status"], "SHORTFALL")
                self.assertAlmostEqual(point["shortfall"], planned - actual, places=2)
            elif variance > 0:
                self.assertEqual(point["status"], "SURPLUS")
                self.assertAlmostEqual(point["surplus"], actual - planned, places=2)

        # Graph 3: Raw Material Procurement vs Remaining Stock
        inv = self.client.get("/api/analytics/material-inventory?material_id=12").get_json()
        self.assertIn("data", inv)
        for dp in inv["data"]:
            self.assertGreaterEqual(dp["procurement_qty"], 0.0) # Procurement never negative!

    # 10. Feasibility Report
    def test_10_material_feasibility_report(self):
        feas = self.client.get("/api/feasibility?start_date=2026-11-01&end_date=2026-11-30").get_json()
        self.assertIn("report", feas)
        for row in feas["report"]:
            self.assertIn("material_id", row)
            self.assertIn("physical_stock", row)
            self.assertIn("reserved_stock", row)
            self.assertIn("available_stock", row)
            self.assertIn("required_qty", row)
            self.assertIn("surplus", row)
            self.assertIn("shortage", row)

    # 11. BOM CRUD & Cost Recalculation
    def test_11_bom_crud(self):
        # Create a new product and test BOM association
        p_res = self.client.post("/api/products", json={
            "name": "Cream & Onion",
            "packet_size": 50,
            "stock_qty": 0,
            "mrp": 20.0
        })
        p_id = p_res.get_json()["id"]

        # Add BOM entry: Product needs 0.05 kg of Salt (ID 14, cost 18.0/kg)
        bom_res = self.client.post("/api/bom", json={
            "product_id": p_id,
            "material_id": 14,
            "qty_required": 0.05
        })
        self.assertEqual(bom_res.status_code, 201)
        bom_id = bom_res.get_json()["id"]

        # Read back
        bom_entry = self.client.get(f"/api/bom/{bom_id}").get_json()
        self.assertEqual(bom_entry["product_id"], p_id)
        self.assertEqual(bom_entry["material_id"], 14)
        self.assertAlmostEqual(float(bom_entry["qty_required"]), 0.05)
        self.assertAlmostEqual(float(bom_entry["cost"]), 0.05 * 18.0)

        # Update BOM entry
        up_bom = self.client.put(f"/api/bom/{bom_id}", json={
            "product_id": p_id,
            "material_id": 14,
            "qty_required": 0.08
        })
        self.assertEqual(up_bom.status_code, 200)

        # Delete BOM entry
        del_bom = self.client.delete(f"/api/bom/{bom_id}")
        self.assertEqual(del_bom.status_code, 200)

        # Clean up test product
        self.client.delete(f"/api/products/{p_id}")

    # 12. Input Validation and Error Handling
    def test_12_validation_and_error_handling(self):
        # 1. Invalid date range
        res = self.client.get("/api/analytics/production-comparison?start_date=2026-11-30&end_date=2026-11-01")
        self.assertEqual(res.status_code, 400)
        self.assertIn("error", res.get_json())

        # 2. Negative planned qty
        res2 = self.client.post("/api/schedule", json={
            "product_id": 10,
            "date": "2026-11-25",
            "planned_qty": -50,
            "actual_qty": 0
        })
        self.assertEqual(res2.status_code, 400)

        # 3. Schedule for product without BOM
        p_res = self.client.post("/api/products", json={
            "name": "No Recipe Chips",
            "packet_size": 20,
            "stock_qty": 0,
            "mrp": 5.0
        })
        p_id = p_res.get_json()["id"]

        res3 = self.client.post("/api/schedule", json={
            "product_id": p_id,
            "date": "2026-11-25",
            "planned_qty": 100,
            "actual_qty": 0
        })
        self.assertEqual(res3.status_code, 400)
        self.assertIn("no bill of materials", res3.get_json()["error"].lower())
        self.client.delete(f"/api/products/{p_id}")

        # 4. Empty reason for stock adjustment
        res4 = self.client.post("/api/materials/14/adjust", json={
            "adjustment_type": "INCREASE",
            "quantity": 10,
            "reason": "   "
        })
        self.assertEqual(res4.status_code, 400)
        self.assertIn("reason", res4.get_json()["error"].lower())

        # 5. Non-existent resource 404
        res5 = self.client.get("/api/materials/999999")
        self.assertEqual(res5.status_code, 404)

if __name__ == "__main__":
    unittest.main(verbosity=2)
