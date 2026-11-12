import sqlite3
from typing import List, Dict, Any, Optional
from database.connection import get_db

def get_all_materials() -> List[Dict[str, Any]]:
    """
    Returns all raw material records with physical stock, reserved stock,
    calculated available stock, and minimum threshold status.
    Available stock = Physical stock - Reserved stock.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                rm.id,
                rm.material_name,
                rm.unit,
                rm.stock_qty,
                rm.cost_per_unit,
                COALESCE(rm.min_stock_threshold, 0.0) AS min_stock_threshold,
                COALESCE(SUM(CASE WHEN sr.status = 'ACTIVE' THEN sr.reserved_qty ELSE 0 END), 0.0) AS reserved_qty,
                (rm.stock_qty - COALESCE(SUM(CASE WHEN sr.status = 'ACTIVE' THEN sr.reserved_qty ELSE 0 END), 0.0)) AS available_qty
            FROM raw_materials rm
            LEFT JOIN stock_reservations sr ON rm.id = sr.material_id
            GROUP BY rm.id, rm.material_name, rm.unit, rm.stock_qty, rm.cost_per_unit, rm.min_stock_threshold
            ORDER BY rm.id ASC
            """
        )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["is_low_stock"] = d["available_qty"] < d["min_stock_threshold"]
            result.append(d)
        return result

def get_material_by_id(material_id: int) -> Optional[Dict[str, Any]]:
    """Returns a specific raw material by ID with reservation and availability details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                rm.id,
                rm.material_name,
                rm.unit,
                rm.stock_qty,
                rm.cost_per_unit,
                COALESCE(rm.min_stock_threshold, 0.0) AS min_stock_threshold,
                COALESCE(SUM(CASE WHEN sr.status = 'ACTIVE' THEN sr.reserved_qty ELSE 0 END), 0.0) AS reserved_qty,
                (rm.stock_qty - COALESCE(SUM(CASE WHEN sr.status = 'ACTIVE' THEN sr.reserved_qty ELSE 0 END), 0.0)) AS available_qty
            FROM raw_materials rm
            LEFT JOIN stock_reservations sr ON rm.id = sr.material_id
            WHERE rm.id = ?
            GROUP BY rm.id, rm.material_name, rm.unit, rm.stock_qty, rm.cost_per_unit, rm.min_stock_threshold
            """,
            (material_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["is_low_stock"] = d["available_qty"] < d["min_stock_threshold"]
        return d

def add_material(
    material_name: str,
    unit: str,
    stock_qty: float,
    cost_per_unit: float,
    min_stock_threshold: float = 0.0,
) -> int:
    """Inserts a new raw material and logs initial stock movement in one atomic transaction."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO raw_materials (material_name, unit, stock_qty, cost_per_unit, min_stock_threshold)
            VALUES (?, ?, ?, ?, ?)
            """,
            (material_name, unit, stock_qty, cost_per_unit, min_stock_threshold),
        )
        new_id = cursor.lastrowid
        if stock_qty > 0:
            cursor.execute(
                """
                INSERT INTO stock_movements (material_id, movement_type, quantity, previous_stock, new_stock, reason)
                VALUES (?, 'INITIAL_BALANCE', ?, 0, ?, 'Initial inventory baseline registration')
                """,
                (new_id, stock_qty, stock_qty),
            )
        return new_id

def update_material(
    material_id: int,
    material_name: str,
    unit: str,
    stock_qty: float,
    cost_per_unit: float,
    min_stock_threshold: float = 0.0,
) -> bool:
    """
    Updates raw material attributes and recalculates BOM unit costs.
    If physical stock_qty was directly updated via this form, records an adjustment log.
    """
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT stock_qty, cost_per_unit FROM raw_materials WHERE id = ?", (material_id,))
        existing = cursor.fetchone()
        if not existing:
            return False

        old_stock = float(existing["stock_qty"])
        cursor.execute(
            "SELECT COALESCE(SUM(reserved_qty), 0) FROM stock_reservations WHERE material_id = ? AND status = 'ACTIVE'",
            (material_id,),
        )
        reserved_qty = float(cursor.fetchone()[0] or 0.0)
        if stock_qty + 1e-9 < reserved_qty:
            raise ValueError(
                f"Physical stock cannot be set below active reservations ({reserved_qty:.2f}). "
                "Release or cancel affected production plans first."
            )
        cursor.execute(
            """
            UPDATE raw_materials
            SET material_name = ?,
                unit = ?,
                stock_qty = ?,
                cost_per_unit = ?,
                min_stock_threshold = ?
            WHERE id = ?
            """,
            (material_name, unit, stock_qty, cost_per_unit, min_stock_threshold, material_id),
        )

        # Recalculate BOM recipe lines using this material
        cursor.execute(
            """
            UPDATE bom
            SET cost = qty_required * ?
            WHERE material_id = ?
            """,
            (cost_per_unit, material_id),
        )

        # Refresh only pending estimates. Completed batch snapshots are never recalculated.
        cursor.execute(
            """SELECT DISTINCT ps.id, ps.product_id, ps.planned_qty
               FROM production_schedule ps JOIN bom b ON b.product_id = ps.product_id
               WHERE b.material_id = ? AND ps.status IN ('SCHEDULED', 'AT_RISK')""",
            (material_id,),
        )
        pending = cursor.fetchall()
        for plan in pending:
            cursor.execute(
                """SELECT COALESCE(SUM(ps.planned_qty * b.qty_required * rm.cost_per_unit), 0)
                   FROM production_schedule ps
                   JOIN bom b ON b.product_id = ps.product_id
                   JOIN raw_materials rm ON rm.id = b.material_id
                   WHERE ps.id = ?""",
                (int(plan["id"]),),
            )
            estimate = float(cursor.fetchone()[0] or 0.0)
            qty = int(plan["planned_qty"])
            cursor.execute(
                "UPDATE production_schedule SET total_cost = ?, unit_cost = ? WHERE id = ?",
                (estimate, estimate / qty if qty else 0.0, int(plan["id"])),
            )

        # Record movement if direct stock change occurred
        if abs(stock_qty - old_stock) > 0.0001:
            diff = stock_qty - old_stock
            m_type = "MANUAL_INCREASE" if diff > 0 else "MANUAL_DECREASE"
            cursor.execute(
                """
                INSERT INTO stock_movements (material_id, movement_type, quantity, previous_stock, new_stock, reason)
                VALUES (?, ?, ?, ?, ?, 'Direct inventory record update')
                """,
                (material_id, m_type, abs(diff), old_stock, stock_qty),
            )

        return True

def adjust_stock(
    material_id: int,
    adjustment_type: str,
    quantity: float,
    reason: str,
) -> Dict[str, Any]:
    """
    Manual stock adjustment (Increase or Decrease).
    Enforces:
    - quantity > 0
    - reason is required and non-empty
    - Prevents negative physical stock
    - Records stock change and movement history atomically
    """
    if quantity <= 0:
        raise ValueError("Adjustment quantity must be greater than zero.")
    if not reason or not reason.strip():
        raise ValueError("A clear reason is required for every stock adjustment.")

    adj_type = adjustment_type.strip().upper()
    if adj_type not in ("INCREASE", "DECREASE", "ADD", "SUBTRACT"):
        raise ValueError("Invalid adjustment type. Must be 'INCREASE' or 'DECREASE'.")

    is_increase = adj_type in ("INCREASE", "ADD")

    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT rm.*,
                   COALESCE(SUM(CASE WHEN sr.status = 'ACTIVE' THEN sr.reserved_qty ELSE 0 END), 0.0) AS reserved_qty
            FROM raw_materials rm
            LEFT JOIN stock_reservations sr ON rm.id = sr.material_id
            WHERE rm.id = ?
            GROUP BY rm.id
            """,
            (material_id,),
        )
        mat = cursor.fetchone()
        if not mat:
            raise LookupError(f"Raw material #{material_id} not found.")

        current_stock = float(mat["stock_qty"])
        reserved_qty = float(mat["reserved_qty"])

        if is_increase:
            new_stock = current_stock + quantity
            movement_type = "MANUAL_INCREASE"
        else:
            new_stock = current_stock - quantity
            if new_stock < 0:
                raise ValueError(
                    f"Stock reduction rejected: Current physical stock is {current_stock} {mat['unit']}. "
                    f"Deducting {quantity} {mat['unit']} would result in negative stock ({new_stock} {mat['unit']})."
                )
            if new_stock + 1e-9 < reserved_qty:
                raise ValueError(
                    f"Stock reduction rejected: {reserved_qty:.2f} {mat['unit']} is reserved by pending production. "
                    "Release or cancel those plans before reducing stock."
                )
            movement_type = "MANUAL_DECREASE"

        cursor.execute(
            "UPDATE raw_materials SET stock_qty = ? WHERE id = ?",
            (new_stock, material_id),
        )

        cursor.execute(
            """
            INSERT INTO stock_movements (material_id, movement_type, quantity, previous_stock, new_stock, reason)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (material_id, movement_type, quantity, current_stock, new_stock, reason.strip()),
        )
        movement_id = cursor.lastrowid

        return {
            "success": True,
            "material_id": material_id,
            "material_name": mat["material_name"],
            "unit": mat["unit"],
            "movement_type": movement_type,
            "quantity": quantity,
            "previous_stock": current_stock,
            "new_stock": new_stock,
            "reserved_qty": reserved_qty,
            "available_stock": new_stock - reserved_qty,
            "reason": reason.strip(),
            "movement_id": movement_id,
        }

def get_stock_movements(material_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Returns chronological stock movement history with material details."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                sm.*,
                rm.material_name,
                rm.unit
            FROM stock_movements sm
            JOIN raw_materials rm ON sm.material_id = rm.id
        """
        params: list = []
        if material_id:
            query += " WHERE sm.material_id = ?"
            params.append(material_id)
        query += " ORDER BY sm.created_at DESC, sm.id DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, tuple(params))
        return [dict(r) for r in cursor.fetchall()]

def get_low_stock_alerts() -> List[Dict[str, Any]]:
    """
    Returns list of raw materials currently at or below their minimum stock threshold,
    taking into account active reservations.
    """
    materials = get_all_materials()
    alerts = []
    for m in materials:
        if m["available_qty"] < m["min_stock_threshold"]:
            deficit = max(0.0, m["min_stock_threshold"] - m["available_qty"])
            alerts.append({
                "material_id": m["id"],
                "material_name": m["material_name"],
                "unit": m["unit"],
                "physical_stock": m["stock_qty"],
                "reserved_qty": m["reserved_qty"],
                "available_qty": m["available_qty"],
                "min_stock_threshold": m["min_stock_threshold"],
                "deficit": deficit,
                "urgency": "CRITICAL" if m["available_qty"] <= 0 else "WARNING",
                "message": (
                    f"Low Stock Alert: {m['material_name']} available stock ({m['available_qty']:.1f} {m['unit']}) "
                    f"is below safety threshold ({m['min_stock_threshold']:.1f} {m['unit']}). "
                    f"Physical: {m['stock_qty']:.1f}, Reserved: {m['reserved_qty']:.1f}."
                ),
            })
    return alerts

def get_reorder_suggestions() -> List[Dict[str, Any]]:
    """
    Calculates transparent purchase suggestions for all raw materials.
    Suggested Purchase Quantity covers safety stock plus demand from AT_RISK plans.
    Fully reserved SCHEDULED plans are not counted again because reservations already reduce available stock.
    Never produces negative quantities and never changes physical inventory.
    """
    materials = get_all_materials()
    suggestions = []
    for m in materials:
        phys = float(m["stock_qty"])
        res = float(m["reserved_qty"])
        avail = phys - res
        thresh = float(m["min_stock_threshold"])
        unit_cost = float(m["cost_per_unit"])

        # Only AT_RISK plans are unreserved; include their gross BOM demand once.
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(
                """SELECT COALESCE(SUM(ps.planned_qty * b.qty_required), 0.0)
                   FROM production_schedule ps
                   JOIN bom b ON b.product_id = ps.product_id
                   WHERE b.material_id = ? AND ps.status = 'AT_RISK'""",
                (m["id"],),
            )
            unreserved_demand = float(cur.fetchone()[0] or 0.0)
        target_qty = thresh + unreserved_demand
        deficit = target_qty - avail
        suggested_qty = max(0.0, deficit)
        estimated_cost = suggested_qty * unit_cost

        if avail <= 0:
            status = "CRITICAL_STOCKOUT"
        elif avail < thresh:
            status = "BELOW_MINIMUM_THRESHOLD"
        elif suggested_qty > 0:
            status = "PRODUCTION_DEMAND_SHORTFALL"
        else:
            status = "SUFFICIENT"

        suggestions.append({
            "material_id": m["id"],
            "material_name": m["material_name"],
            "unit": m["unit"],
            "physical_stock": phys,
            "reserved_stock": res,
            "available_stock": avail,
            "min_stock_threshold": thresh,
            "unreserved_scheduled_demand": round(unreserved_demand, 2),
            "target_stock_for_reorder": round(target_qty, 2),
            "suggested_purchase_qty": round(suggested_qty, 2),
            "unit_cost": unit_cost,
            "estimated_cost": round(estimated_cost, 2),
            "status": status,
            "reorder_needed": suggested_qty > 0,
        })
    return suggestions

def delete_material(material_id: int) -> None:
    """
    Deletes a raw material. Enforces foreign key constraint checks
    and blocks deletion if referenced by active BOM recipes or reservations.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM bom WHERE material_id = ?", (material_id,))
        bom_ref = cursor.fetchone()["count"]
        if bom_ref > 0:
            raise ValueError(
                f"Deletion Blocked: Material is referenced in {bom_ref} active "
                "Bill of Materials (BOM) recipe(s). Remove recipe associations before deleting."
            )

        cursor.execute(
            "SELECT COUNT(*) as count FROM stock_reservations WHERE material_id = ? AND status = 'ACTIVE'",
            (material_id,),
        )
        res_ref = cursor.fetchone()["count"]
        if res_ref > 0:
            raise ValueError(
                f"Deletion Blocked: Material has {res_ref} active production reservation(s). "
                "Complete or cancel scheduled production runs before deleting."
            )

        cursor.execute("DELETE FROM stock_movements WHERE material_id = ?", (material_id,))
        cursor.execute("DELETE FROM raw_materials WHERE id = ?", (material_id,))
        if cursor.rowcount == 0:
            raise LookupError(f"Material #{material_id} not found.")
