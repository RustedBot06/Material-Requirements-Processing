
from typing import Optional, Dict, Any, List

from database.connection import get_db
from .production import get_filtered_production, get_product_by_id
from .inventory import get_material_by_id, get_all_materials


def get_production_comparison_data(
    product_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analytics Graph 1 — Planned vs Actual Production.
    Variance = Actual - Planned
    - Negative: Shortfall
    - Zero: Exact Target
    - Positive: Surplus
    """
    records = get_filtered_production(product_id, start_date, end_date)

    selected_product = None
    if product_id:
        prod = get_product_by_id(product_id)
        if prod:
            selected_product = {
                "id": prod["id"],
                "name": prod["name"],
                "packet_size": prod["packet_size"],
                "display_name": f"{prod['name']} - {prod['packet_size']}g"
            }

    data_points: List[Dict[str, Any]] = []
    total_planned = 0.0
    total_actual = 0.0

    for r in records:
        planned = float(r["planned_qty"] or 0)
        actual = float(r["actual_qty"] or 0)
        variance = actual - planned
        achievement = (
            actual / planned * 100
            if planned > 0
            else (100.0 if actual == 0 else 0.0)
        )

        total_planned += planned
        total_actual += actual

        data_points.append({
            "date": r["date"],
            "planned_qty": planned,
            "actual_qty": actual,
            "variance": variance,
            "shortfall": max(0.0, planned - actual),
            "surplus": max(0.0, actual - planned),
            "achievement_pct": round(achievement, 2),
        })

    net_variance = total_actual - total_planned
    overall_achievement = (
        total_actual / total_planned * 100
        if total_planned > 0 else 0.0
    )

    return {
        "metric": "planned_vs_actual_production",
        "chart_type": "line",
        "product_id": product_id,
        "selected_product": selected_product,
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_planned": total_planned,
            "total_actual": total_actual,
            "net_variance": net_variance,
            "overall_achievement_pct": round(overall_achievement, 2),
            "record_count": len(data_points),
        },
        "data": data_points,
    }


def get_production_shortfall_data(
    product_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analytics Graph 2 — Actual Production vs Variance
    (Shortfall and Surplus).
    Variance = Actual - Planned
    """
    records = get_filtered_production(product_id, start_date, end_date)

    selected_product = None
    if product_id:
        prod = get_product_by_id(product_id)
        if prod:
            selected_product = {
                "id": prod["id"],
                "name": prod["name"],
                "packet_size": prod["packet_size"],
                "display_name": f"{prod['name']} - {prod['packet_size']}g"
            }

    data_points: List[Dict[str, Any]] = []
    total_actual = 0.0
    total_planned = 0.0
    total_shortfall = 0.0
    total_surplus = 0.0
    days_with_shortfall = 0
    days_with_surplus = 0
    peak_shortfall = 0.0
    peak_shortfall_date = None

    for r in records:
        planned = float(r["planned_qty"] or 0)
        actual = float(r["actual_qty"] or 0)
        variance = actual - planned
        shortfall = max(0.0, planned - actual)
        surplus = max(0.0, actual - planned)

        total_actual += actual
        total_planned += planned
        total_shortfall += shortfall
        total_surplus += surplus

        if shortfall > 0:
            days_with_shortfall += 1
            if shortfall > peak_shortfall:
                peak_shortfall = shortfall
                peak_shortfall_date = r["date"]

        if surplus > 0:
            days_with_surplus += 1

        shortfall_pct = (
            shortfall / planned * 100
            if planned > 0 else 0.0
        )

        data_points.append({
            "date": r["date"],
            "actual_qty": actual,
            "planned_qty": planned,
            "variance": variance,
            "shortfall": shortfall,
            "surplus": surplus,
            "shortfall_pct": round(shortfall_pct, 2),
            "status": (
                "SHORTFALL" if variance < 0
                else ("SURPLUS" if variance > 0 else "EXACT")
            ),
        })

    avg_shortfall = (
        total_shortfall / len(data_points)
        if data_points else 0.0
    )
    shortfall_rate = (
        total_shortfall / total_planned * 100
        if total_planned > 0 else 0.0
    )

    return {
        "metric": "actual_production_vs_shortfall",
        "chart_type": "grouped_bar",
        "product_id": product_id,
        "selected_product": selected_product,
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_actual": total_actual,
            "total_planned": total_planned,
            "total_shortfall": total_shortfall,
            "total_surplus": total_surplus,
            "net_variance": total_actual - total_planned,
            "days_with_shortfall": days_with_shortfall,
            "days_with_surplus": days_with_surplus,
            "peak_shortfall": peak_shortfall,
            "peak_shortfall_date": peak_shortfall_date,
            "average_daily_shortfall": round(avg_shortfall, 2),
            "shortfall_rate_pct": round(shortfall_rate, 2),
            "record_count": len(data_points),
        },
        "data": data_points,
    }


def get_material_inventory_data(
    material_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analytics Graph 3 — Raw Material Stock Movement Analysis.

    Source of truth: stock_movements ledger.

    Inflow:
        PURCHASE_RECEIPT
        MANUAL_INCREASE

    Outflow:
        PRODUCTION_CONSUMPTION
        MANUAL_DECREASE

    INITIAL_BALANCE is treated as an opening balance, not an inflow.

    The physical stock line uses the latest new_stock value recorded
    for each day. Historical consumption is never reconstructed from
    the current BOM.
    """

    materials = get_all_materials()

    target_id = (
        material_id
        if material_id is not None
        else (materials[0]["id"] if materials else None)
    )

    selected_material = (
        get_material_by_id(target_id)
        if target_id is not None
        else None
    )

    if not selected_material:
        return {
            "metric": "raw_material_procurement_vs_stock",
            "historical_data_available": False,
            "chart_type": "line",
            "material_id": None,
            "selected_material": None,
            "start_date": start_date,
            "end_date": end_date,
            "diagnostic_note": "No raw material found.",
            "summary": {
                "total_procurement_inflow": 0.0,
                "total_consumption_outflow": 0.0,
                "total_adjustment_outflow": 0.0,
                "net_flow": 0.0,
                "record_count": 0,
            },
            "current_stock_summary": {},
            "data": [],
        }

    # ---------------------------------------------------------
    # 1. Read daily movement totals and daily closing balances.
    # ---------------------------------------------------------

    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                substr(sm.created_at, 1, 10) AS movement_date,

                SUM(
                    CASE
                        WHEN sm.movement_type IN (
                            'PURCHASE_RECEIPT',
                            'MANUAL_INCREASE'
                        )
                        THEN sm.quantity
                        ELSE 0
                    END
                ) AS inflow,

                SUM(
                    CASE
                        WHEN sm.movement_type = 'INITIAL_BALANCE'
                        THEN sm.quantity
                        ELSE 0
                    END
                ) AS initial_balance,

                SUM(
                    CASE
                        WHEN sm.movement_type = 'PRODUCTION_CONSUMPTION'
                        THEN sm.quantity
                        ELSE 0
                    END
                ) AS production_outflow,

                SUM(
                    CASE
                        WHEN sm.movement_type = 'MANUAL_DECREASE'
                        THEN sm.quantity
                        ELSE 0
                    END
                ) AS adjustment_outflow,

                COUNT(*) AS movement_count,

                (
                    SELECT sm2.new_stock
                    FROM stock_movements sm2
                    WHERE sm2.material_id = sm.material_id
                      AND substr(sm2.created_at, 1, 10) =
                          substr(sm.created_at, 1, 10)
                    ORDER BY sm2.created_at DESC, sm2.id DESC
                    LIMIT 1
                ) AS closing_stock

            FROM stock_movements sm
            WHERE sm.material_id = ?

            GROUP BY
                sm.material_id,
                substr(sm.created_at, 1, 10)

            ORDER BY movement_date ASC
            """,
            (target_id,)
        )

        movement_days = [
            dict(row)
            for row in cursor.fetchall()
        ]

    # ---------------------------------------------------------
    # 2. Apply the date range and carry forward the opening
    #    balance from the last ledger entry before start_date.
    # ---------------------------------------------------------

    range_opening_balance = None

    if start_date:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT new_stock
                FROM stock_movements
                WHERE material_id = ?
                  AND substr(created_at, 1, 10) < ?
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """,
                (target_id, start_date)
            )

            prior = cursor.fetchone()

            if prior is not None:
                range_opening_balance = float(
                    prior["new_stock"] or 0.0
                )

        movement_days = [
            row for row in movement_days
            if row["movement_date"] >= start_date
        ]

        if range_opening_balance is not None:
            if (
                movement_days
                and movement_days[0]["movement_date"] == start_date
            ):
                movement_days[0]["initial_balance"] = (
                    float(movement_days[0]["initial_balance"] or 0.0)
                    + range_opening_balance
                )
            else:
                # This is a known opening balance carried forward
                # from the ledger, not a fabricated stock movement.
                movement_days.insert(0, {
                    "movement_date": start_date,
                    "inflow": 0.0,
                    "initial_balance": range_opening_balance,
                    "production_outflow": 0.0,
                    "adjustment_outflow": 0.0,
                    "movement_count": 0,
                    "closing_stock": range_opening_balance,
                    "is_opening_balance_point": True,
                })

    if end_date:
        movement_days = [
            row for row in movement_days
            if row["movement_date"] <= end_date
        ]

    # ---------------------------------------------------------
    # 3. Prepare chart points.
    # ---------------------------------------------------------

    data_points = []

    for row in movement_days:
        inflow = float(row["inflow"] or 0.0)
        initial_balance = float(row["initial_balance"] or 0.0)
        production_outflow = float(
            row["production_outflow"] or 0.0
        )
        adjustment_outflow = float(
            row["adjustment_outflow"] or 0.0
        )

        closing_stock = row["closing_stock"]

        data_points.append({
            "date": row["movement_date"],

            # Green series
            "procurement_qty": round(max(0.0, inflow), 2),

            # Opening balance is shown in the tooltip only.
            "opening_balance_qty": round(
                max(0.0, initial_balance), 2
            ),

            # Red series components
            "consumption_qty": round(
                max(0.0, production_outflow), 2
            ),
            "adjustment_outflow": round(
                max(0.0, adjustment_outflow), 2
            ),

            # Blue series
            "remaining_stock": round(
                float(closing_stock or 0.0), 2
            ),

            "movement_count": int(row["movement_count"] or 0),
            "is_opening_balance_point": bool(
                row.get("is_opening_balance_point", False)
            ),
        })

    actual_movement_count = sum(
        point["movement_count"]
        for point in data_points
    )

    # ---------------------------------------------------------
    # 4. Current inventory and demand summary.
    # ---------------------------------------------------------

    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT COALESCE(
                SUM(ps.planned_qty * b.qty_required),
                0.0
            )
            FROM production_schedule ps
            JOIN bom b ON b.product_id = ps.product_id
            WHERE b.material_id = ?
              AND ps.status = 'AT_RISK'
            """,
            (target_id,)
        )

        unreserved_demand = float(
            cursor.fetchone()[0] or 0.0
        )

    current_stock = float(
        selected_material["stock_qty"] or 0.0
    )

    reserved_stock = float(
        selected_material["reserved_qty"] or 0.0
    )

    available_stock = current_stock - reserved_stock

    threshold = float(
        selected_material["min_stock_threshold"] or 0.0
    )

    unit_cost = float(
        selected_material["cost_per_unit"] or 0.0
    )

    total_procurement = sum(
        point["procurement_qty"]
        for point in data_points
    )

    total_consumption = sum(
        point["consumption_qty"]
        for point in data_points
    )

    total_adjustment_outflow = sum(
        point["adjustment_outflow"]
        for point in data_points
    )

    projected_buffer = available_stock - unreserved_demand

    # ---------------------------------------------------------
    # 5. Final response.
    # ---------------------------------------------------------

    if actual_movement_count == 0 and data_points:
        diagnostic_note = (
            "No stock movements were recorded in the selected "
            "date range. The chart shows the last known opening "
            "balance where available."
        )
    elif not data_points:
        diagnostic_note = (
            "No stock movement history exists in the selected "
            "date range, and no earlier ledger balance is available."
        )
    else:
        diagnostic_note = None

    return {
        "metric": "raw_material_procurement_vs_stock",
        "historical_data_available": actual_movement_count > 0,
        "chart_type": "line",
        "material_id": target_id,
        "selected_material": selected_material,
        "start_date": start_date,
        "end_date": end_date,
        "diagnostic_note": diagnostic_note,

        "summary": {
            "total_procurement_inflow": round(
                total_procurement, 2
            ),
            "total_consumption_outflow": round(
                total_consumption, 2
            ),
            "total_adjustment_outflow": round(
                total_adjustment_outflow, 2
            ),
            "net_flow": round(
                total_procurement
                - total_consumption
                - total_adjustment_outflow,
                2
            ),
            "record_count": actual_movement_count,
        },

        "current_stock_summary": {
            "material_name": selected_material["material_name"],
            "unit": selected_material["unit"],
            "on_hand_stock": current_stock,
            "reserved_stock": reserved_stock,
            "available_stock": available_stock,
            "min_stock_threshold": threshold,
            "cost_per_unit": unit_cost,
            "total_valuation_inr": round(
                current_stock * unit_cost, 2
            ),
            "total_scheduled_demand": round(
                unreserved_demand, 2
            ),
            "projected_buffer": round(
                projected_buffer, 2
            ),
            "adequacy_status": (
                "Sufficient"
                if projected_buffer >= threshold
                else "Low Stock Alert"
            ),
        },

        "data": data_points,
    }