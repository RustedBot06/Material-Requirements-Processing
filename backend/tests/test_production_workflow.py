"""Service-level regression tests for the MRP planning/reservation/completion lifecycle.

These tests use a temporary copy of the bundled database and never modify the user's DB.
"""
import shutil
import sqlite3
import tempfile
import unittest
from pathlib import Path

import config

BASE_DB = Path(config.DB_PATH)


class ProductionWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = Path(tempfile.mkdtemp(prefix="chips_mrp_workflow_"))
        cls.test_db = cls.temp_dir / "workflow_test.db"
        cls.original_db_path = config.DB_PATH
        config.DB_PATH = cls.test_db

        from services.production import (
            add_schedule, reserve_schedule, complete_schedule, cancel_schedule,
            get_schedule_by_id, update_bom, get_schedule_cost_breakdown,
            get_material_feasibility_report, get_cost_trends,
        )
        from services.inventory import (
            get_material_by_id, update_material, adjust_stock, get_reorder_suggestions,
        )
        from services.analytics import get_material_inventory_data

        cls.add_schedule = staticmethod(add_schedule)
        cls.reserve_schedule = staticmethod(reserve_schedule)
        cls.complete_schedule = staticmethod(complete_schedule)
        cls.cancel_schedule = staticmethod(cancel_schedule)
        cls.get_schedule_by_id = staticmethod(get_schedule_by_id)
        cls.update_bom = staticmethod(update_bom)
        cls.get_schedule_cost_breakdown = staticmethod(get_schedule_cost_breakdown)
        cls.get_material_feasibility_report = staticmethod(get_material_feasibility_report)
        cls.get_cost_trends = staticmethod(get_cost_trends)
        cls.get_material_by_id = staticmethod(get_material_by_id)
        cls.update_material = staticmethod(update_material)
        cls.adjust_stock = staticmethod(adjust_stock)
        cls.get_reorder_suggestions = staticmethod(get_reorder_suggestions)
        cls.get_material_inventory_data = staticmethod(get_material_inventory_data)

    @classmethod
    def tearDownClass(cls):
        config.DB_PATH = cls.original_db_path
        shutil.rmtree(cls.temp_dir, ignore_errors=True)

    def setUp(self):
        shutil.copy2(BASE_DB, self.test_db)
        from database.migrate import run_migrations
        run_migrations(self.test_db)

    def _db(self):
        conn = sqlite3.connect(self.test_db)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def test_shortage_plan_is_created_without_partial_reservation(self):
        before = self.get_material_by_id(13)["stock_qty"]
        schedule_id = self.add_schedule(11, "2026-12-01", 6000, 0)  # 672 L required, 501 L physical
        plan = self.get_schedule_by_id(schedule_id)
        self.assertEqual(plan["status"], "AT_RISK")
        self.assertEqual(plan["material_shortages"][0]["material_name"], "Edible oil (Palm)")
        self.assertAlmostEqual(plan["material_shortages"][0]["shortage_qty"], 171.0)
        self.assertEqual(self.get_material_by_id(13)["stock_qty"], before)

        with self._db() as conn:
            active = conn.execute(
                "SELECT COUNT(*) FROM stock_reservations WHERE schedule_id = ? AND status = 'ACTIVE'",
                (schedule_id,),
            ).fetchone()[0]
        self.assertEqual(active, 0)

        suggestion = next(x for x in self.get_reorder_suggestions() if x["material_id"] == 13)
        self.assertAlmostEqual(suggestion["suggested_purchase_qty"], 271.0)
        self.assertEqual(self.get_material_by_id(13)["stock_qty"], before)  # suggestion never procures

        material = self.get_material_by_id(13)
        self.update_material(13, material["material_name"], material["unit"], 1000.0,
                             material["cost_per_unit"], material["min_stock_threshold"])
        self.reserve_schedule(schedule_id)
        self.assertEqual(self.get_schedule_by_id(schedule_id)["status"], "SCHEDULED")
        reserved = self.get_material_by_id(13)
        self.assertAlmostEqual(reserved["reserved_qty"], 672.0)
        self.assertAlmostEqual(reserved["available_qty"], 328.0)

    def test_bom_and_price_changes_refresh_estimates_not_completed_history(self):
        schedule_id = self.add_schedule(11, "2026-12-02", 1000, 0)
        with self._db() as conn:
            bom_id = conn.execute(
                "SELECT id FROM bom WHERE product_id = 11 AND material_id = 13"
            ).fetchone()[0]

        self.update_bom(bom_id, 0.15)
        plan = self.get_schedule_by_id(schedule_id)
        self.assertEqual(plan["status"], "AT_RISK")
        self.assertAlmostEqual(plan["total_cost"], 21750.0)
        self.assertEqual(self.get_material_by_id(13)["reserved_qty"], 0.0)

        material = self.get_material_by_id(13)
        self.update_material(13, material["material_name"], material["unit"], material["stock_qty"],
                             200.0, material["min_stock_threshold"])
        self.assertAlmostEqual(self.get_schedule_by_id(schedule_id)["total_cost"], 30000.0)

        self.reserve_schedule(schedule_id)
        completed = self.complete_schedule(schedule_id, 900)
        self.assertAlmostEqual(completed["total_material_cost"], 27000.0)

        material = self.get_material_by_id(13)
        self.update_material(13, material["material_name"], material["unit"], material["stock_qty"],
                             250.0, material["min_stock_threshold"])
        breakdown = self.get_schedule_cost_breakdown(schedule_id)
        self.assertEqual(breakdown["cost_type"], "ACTUAL_HISTORICAL")
        self.assertAlmostEqual(breakdown["total_material_cost"], 27000.0)
        self.assertAlmostEqual(breakdown["unit_material_cost"], 30.0)
        trend = next(t for t in self.get_cost_trends(11) if t["schedule_id"] == schedule_id)
        self.assertEqual(trend["cost_source"], "ACTUAL_HISTORICAL")

    def test_reserved_stock_cannot_be_reduced_and_overconsumption_rolls_back(self):
        first = self.add_schedule(11, "2026-12-03", 1000, 0)  # 112 L
        second = self.add_schedule(11, "2026-12-04", 3000, 0)  # 336 L; combined 448 L
        self.assertEqual(self.get_schedule_by_id(first)["status"], "SCHEDULED")
        self.assertEqual(self.get_schedule_by_id(second)["status"], "SCHEDULED")

        with self.assertRaisesRegex(ValueError, "reserved"):
            self.adjust_stock(13, "DECREASE", 100.0, "test reduction")

        stock_before = self.get_material_by_id(13)["stock_qty"]
        with self.assertRaisesRegex(ValueError, "insufficient stock"):
            self.complete_schedule(first, 3000)  # would consume 336 L while 336 L is reserved for second
        self.assertEqual(self.get_material_by_id(13)["stock_qty"], stock_before)

        self.complete_schedule(first, 1000)
        self.assertAlmostEqual(self.get_material_by_id(13)["stock_qty"], 389.0)
        self.assertAlmostEqual(self.get_material_by_id(13)["reserved_qty"], 336.0)
        self.complete_schedule(second, 3000)
        self.assertAlmostEqual(self.get_material_by_id(13)["stock_qty"], 53.0)

    def test_stock_graph_uses_ledger_and_separates_opening_balance(self):
        schedule_id = self.add_schedule(11, "2026-12-05", 1000, 0)
        self.complete_schedule(schedule_id, 1000)
        graph = self.get_material_inventory_data(13)
        baseline = next(p for p in graph["data"] if p["date"] == "2026-11-08")
        self.assertAlmostEqual(baseline["opening_balance_qty"], 501.0)
        self.assertEqual(baseline["procurement_qty"], 0.0)
        with self._db() as conn:
            movement_date = conn.execute(
                "SELECT substr(created_at, 1, 10) FROM stock_movements WHERE reference_id = ? AND movement_type = 'PRODUCTION_CONSUMPTION'",
                (schedule_id,),
            ).fetchone()[0]
        completion_day = next(p for p in graph["data"] if p["date"] == movement_date)
        self.assertGreaterEqual(completion_day["consumption_qty"], 112.0)
        filtered = self.get_material_inventory_data(13, start_date="2026-11-10", end_date="2026-11-10")
        self.assertEqual(len(filtered["data"]), 1)
        self.assertAlmostEqual(filtered["data"][0]["remaining_stock"], 501.0)

    def test_existing_cost_rows_are_labelled_legacy_unverified(self):
        # The archive contains historical cost rows but no trustworthy completion movement
        # records for them. Migration marks them as legacy instead of claiming they are actual.
        breakdown = self.get_schedule_cost_breakdown(12)
        self.assertEqual(breakdown["cost_type"], "LEGACY_UNVERIFIED")
        self.assertIn("legacy", breakdown["cost_note"].lower())
        trend = next(t for t in self.get_cost_trends() if t["schedule_id"] == 12)
        self.assertEqual(trend["cost_source"], "LEGACY_UNVERIFIED")

    def test_shortage_on_one_ingredient_does_not_partially_reserve_other_ingredients(self):
        # Product 10 has both potato and oil in its BOM. Potato is available but oil is not.
        schedule_id = self.add_schedule(10, "2026-12-11", 10000, 0)
        self.assertEqual(self.get_schedule_by_id(schedule_id)["status"], "AT_RISK")
        with self._db() as conn:
            rows = conn.execute(
                "SELECT material_id, status FROM stock_reservations WHERE schedule_id = ?",
                (schedule_id,),
            ).fetchall()
        self.assertEqual(len(rows), 0)
        shortage_ids = {item["material_id"] for item in self.get_schedule_by_id(schedule_id)["material_shortages"]}
        self.assertIn(13, shortage_ids)  # Palm oil is short

    def test_feasibility_and_reorder_do_not_double_count_reserved_plans(self):
        # Run A reserves 224 L. Run B cannot reserve its 336 L and remains AT_RISK.
        self.add_schedule(11, "2026-12-09", 2000, 0)
        self.add_schedule(11, "2026-12-10", 3000, 0)
        report = self.get_material_feasibility_report("2026-12-09", "2026-12-10")
        oil = next(r for r in report if r["material_id"] == 13)
        self.assertAlmostEqual(oil["reserved_stock"], 224.0)
        self.assertAlmostEqual(oil["available_stock"], 277.0)
        self.assertAlmostEqual(oil["required_qty"], 336.0)  # only unreserved AT_RISK demand
        self.assertAlmostEqual(oil["shortage"], 59.0)
        suggestion = next(r for r in self.get_reorder_suggestions() if r["material_id"] == 13)
        self.assertAlmostEqual(suggestion["suggested_purchase_qty"], 159.0)  # 59 short + 100 safety stock

    def test_migration_demotes_unreserved_legacy_scheduled_plans(self):
        with self._db() as conn:
            cursor = conn.execute(
                "INSERT INTO production_schedule (product_id, date, planned_qty, actual_qty, status, total_cost, unit_cost) VALUES (11, '2026-12-08', 1000, 0, 'SCHEDULED', 0, 0)"
            )
            schedule_id = cursor.lastrowid
        from database.migrate import run_migrations
        run_migrations(self.test_db)
        self.assertEqual(self.get_schedule_by_id(schedule_id)["status"], "AT_RISK")

    def test_cancel_at_risk_plan(self):
        schedule_id = self.add_schedule(11, "2026-12-06", 6000, 0)
        self.assertEqual(self.get_schedule_by_id(schedule_id)["status"], "AT_RISK")
        self.cancel_schedule(schedule_id)
        self.assertEqual(self.get_schedule_by_id(schedule_id)["status"], "CANCELLED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
