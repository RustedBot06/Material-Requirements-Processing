import sqlite3
from typing import List, Dict, Any, Optional
from database.connection import get_db
from .inventory import get_all_materials, get_material_by_id

# --- PRODUCTS ---

def get_all_products() -> List[Dict[str, Any]]:
    """Returns all products ordered by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products ORDER BY id ASC")
        return [dict(row) for row in cursor.fetchall()]

def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
    """Returns product by ID or None."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def add_product(name: str, packet_size: int, stock_qty: int, mrp: float) -> int:
    """Inserts a new product SKU."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO products (name, packet_size, stock_qty, mrp)
            VALUES (?, ?, ?, ?)
            """,
            (name, packet_size, stock_qty, mrp),
        )
        return cursor.lastrowid

def update_product(product_id: int, name: str, packet_size: int, stock_qty: int, mrp: float) -> bool:
    """Updates product SKU details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE products
            SET name = ?, packet_size = ?, stock_qty = ?, mrp = ?
            WHERE id = ?
            """,
            (name, packet_size, stock_qty, mrp, product_id),
        )
        return cursor.rowcount > 0

def delete_product(product_id: int) -> None:
    """
    Deletes product SKU.
    Blocks deletion if referenced in BOM recipes or production schedule.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM bom WHERE product_id = ?", (product_id,))
        bom_ref = cursor.fetchone()["count"]
        if bom_ref > 0:
            raise ValueError(
                f"Deletion Blocked: Product is referenced in {bom_ref} Bill of Materials (BOM) recipe(s). "
                "Remove recipe associations before deleting."
            )

        cursor.execute("SELECT COUNT(*) as count FROM production_schedule WHERE product_id = ?", (product_id,))
        sched_ref = cursor.fetchone()["count"]
        if sched_ref > 0:
            raise ValueError(
                f"Deletion Blocked: Product has {sched_ref} production schedule run(s). "
                "Remove scheduled runs before deleting."
            )

        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        if cursor.rowcount == 0:
            raise LookupError(f"Product #{product_id} not found.")

# --- BILL OF MATERIALS (BOM) ---

def get_all_bom() -> List[Dict[str, Any]]:
    """Returns all BOM entries joined with products and raw materials."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                bom.*,
                products.name AS product_name,
                products.packet_size AS packet_size,
                raw_materials.material_name,
                raw_materials.unit,
                raw_materials.cost_per_unit
            FROM bom
            JOIN products ON bom.product_id = products.id
            JOIN raw_materials ON bom.material_id = raw_materials.id
            ORDER BY bom.id ASC
            """
        )
        return [dict(row) for row in cursor.fetchall()]

def get_bom_by_id(bom_id: int) -> Optional[Dict[str, Any]]:
    """Returns single BOM entry with join details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                bom.*,
                products.name AS product_name,
                products.packet_size AS packet_size,
                raw_materials.material_name,
                raw_materials.unit,
                raw_materials.cost_per_unit
            FROM bom
            JOIN products ON bom.product_id = products.id
            JOIN raw_materials ON bom.material_id = raw_materials.id
            WHERE bom.id = ?
            """,
            (bom_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None

def get_bom_for_product(product_id: int) -> List[Dict[str, Any]]:
    """Returns all recipe lines for a specific product."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                bom.*,
                raw_materials.material_name,
                raw_materials.unit,
                raw_materials.cost_per_unit,
                raw_materials.stock_qty
            FROM bom
            JOIN raw_materials ON bom.material_id = raw_materials.id
            WHERE bom.product_id = ?
            ORDER BY bom.id ASC
            """,
            (product_id,),
        )
        return [dict(row) for row in cursor.fetchall()]



def _get_bom_rows(cursor, product_id: int):
    cursor.execute(
        """
        SELECT b.material_id, SUM(b.qty_required) AS qty_required, rm.material_name, rm.unit,
               rm.cost_per_unit, rm.stock_qty
        FROM bom b
        JOIN raw_materials rm ON rm.id = b.material_id
        WHERE b.product_id = ?
        GROUP BY b.material_id, rm.material_name, rm.unit, rm.cost_per_unit, rm.stock_qty
        ORDER BY rm.material_name
        """,
        (product_id,),
    )
    return [dict(row) for row in cursor.fetchall()]


def _estimate_batch_cost(cursor, product_id: int, planned_qty: int):
    items = _get_bom_rows(cursor, product_id)
    total = sum(
        planned_qty * float(item["qty_required"]) * float(item["cost_per_unit"])
        for item in items
    )
    return items, total, (total / planned_qty if planned_qty > 0 else 0.0)


def _available_for_material(cursor, material_id: int, exclude_schedule_id: Optional[int] = None):
    params = []
    exclusion = ""
    if exclude_schedule_id is not None:
        exclusion = " AND schedule_id != ?"
        params.append(exclude_schedule_id)
    params.append(material_id)
    cursor.execute(
        f"""
        SELECT rm.material_name, rm.unit, rm.stock_qty,
               COALESCE((SELECT SUM(sr.reserved_qty) FROM stock_reservations sr
                         WHERE sr.material_id = rm.id AND sr.status = 'ACTIVE'{exclusion}), 0) AS reserved_qty
        FROM raw_materials rm WHERE rm.id = ?
        """,
        tuple(params),
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Raw material #{material_id} does not exist.")
    return dict(row)


def _get_schedule_shortages(cursor, schedule_row):
    """Return material-level shortages for an AT_RISK plan using current free stock."""
    if schedule_row["status"] != "AT_RISK":
        return []
    items = _get_bom_rows(cursor, int(schedule_row["product_id"]))
    shortages = []
    for item in items:
        state = _available_for_material(cursor, int(item["material_id"]))
        available = max(0.0, float(state["stock_qty"]) - float(state["reserved_qty"]))
        required = int(schedule_row["planned_qty"]) * float(item["qty_required"])
        shortage = max(0.0, required - available)
        if shortage > 1e-9:
            shortages.append({
                "material_id": int(item["material_id"]),
                "material_name": state["material_name"],
                "unit": state["unit"],
                "required_qty": round(required, 3),
                "available_qty": round(available, 3),
                "shortage_qty": round(shortage, 3),
            })
    return shortages


def _invalidate_pending_schedules_for_product(cursor, product_id: int):
    """BOM changes invalidate reservations for uncompleted schedules; estimates are refreshed."""
    cursor.execute(
        """SELECT id, planned_qty FROM production_schedule
           WHERE product_id = ? AND status IN ('SCHEDULED', 'AT_RISK')""",
        (product_id,),
    )
    pending = cursor.fetchall()
    for schedule in pending:
        sid = int(schedule["id"])
        cursor.execute(
            """UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
               WHERE schedule_id = ? AND status = 'ACTIVE'""",
            (sid,),
        )
        _, total, unit = _estimate_batch_cost(cursor, product_id, int(schedule["planned_qty"]))
        cursor.execute(
            """UPDATE production_schedule SET status = 'AT_RISK', total_cost = ?, unit_cost = ?
               WHERE id = ?""",
            (total, unit, sid),
        )


def _refresh_pending_estimates_for_material(cursor, material_id: int):
    """Refresh estimates after a raw-material price change; never alter completed snapshots."""
    cursor.execute(
        """SELECT DISTINCT ps.id, ps.product_id, ps.planned_qty
           FROM production_schedule ps
           JOIN bom b ON b.product_id = ps.product_id
           WHERE b.material_id = ? AND ps.status IN ('SCHEDULED', 'AT_RISK')""",
        (material_id,),
    )
    for row in cursor.fetchall():
        _, total, unit = _estimate_batch_cost(cursor, int(row["product_id"]), int(row["planned_qty"]))
        cursor.execute(
            "UPDATE production_schedule SET total_cost = ?, unit_cost = ? WHERE id = ?",
            (total, unit, int(row["id"])),
        )

def add_bom(product_id: int, material_id: int, qty_required: float) -> int:
    """Adds a BOM line and invalidates estimates/reservations on pending plans."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT cost_per_unit FROM raw_materials WHERE id = ?", (material_id,))
        mat = cursor.fetchone()
        if not mat:
            raise ValueError(f"Raw material #{material_id} does not exist.")
        cursor.execute(
            "INSERT INTO bom (product_id, material_id, qty_required, cost) VALUES (?, ?, ?, ?)",
            (product_id, material_id, qty_required, qty_required * float(mat["cost_per_unit"])),
        )
        new_id = cursor.lastrowid
        _invalidate_pending_schedules_for_product(cursor, product_id)
        return new_id

def update_bom(bom_id: int, qty_required: float) -> bool:
    """Updates a BOM line; pending plans are recalculated and reservations released for re-check."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT product_id FROM bom WHERE id = ?", (bom_id,))
        row = cursor.fetchone()
        if not row:
            return False
        product_id = int(row["product_id"])
        cursor.execute(
            """UPDATE bom SET qty_required = ?,
               cost = ? * (SELECT cost_per_unit FROM raw_materials WHERE id = bom.material_id)
               WHERE id = ?""",
            (qty_required, qty_required, bom_id),
        )
        updated = cursor.rowcount > 0
        _invalidate_pending_schedules_for_product(cursor, product_id)
        return updated


def delete_bom(bom_id: int) -> None:
    """Deletes a BOM line and refreshes all pending plans for the affected product."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT product_id FROM bom WHERE id = ?", (bom_id,))
        row = cursor.fetchone()
        if not row:
            raise LookupError(f"BOM recipe entry #{bom_id} not found.")
        product_id = int(row["product_id"])
        cursor.execute("DELETE FROM bom WHERE id = ?", (bom_id,))
        _invalidate_pending_schedules_for_product(cursor, product_id)

# --- PRODUCTION SCHEDULE & RESERVATIONS ---

def get_all_schedules() -> List[Dict[str, Any]]:
    """Returns all production schedule entries with status and costing information."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                ps.*,
                products.name AS product_name,
                products.packet_size
            FROM production_schedule ps
            JOIN products ON ps.product_id = products.id
            ORDER BY ps.date DESC, ps.id DESC
            """
        )
        rows = [dict(r) for r in cursor.fetchall()]
        for r in rows:
            if not r.get("status"):
                r["status"] = "COMPLETED" if (r.get("actual_qty") or 0) > 0 else "AT_RISK"
            r["material_shortages"] = _get_schedule_shortages(cursor, r)
        return rows

def get_schedule_by_id(schedule_id: int) -> Optional[Dict[str, Any]]:
    """Returns schedule by ID with join details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                ps.*,
                products.name AS product_name,
                products.packet_size
            FROM production_schedule ps
            JOIN products ON ps.product_id = products.id
            WHERE ps.id = ?
            """,
            (schedule_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if not d.get("status"):
            d["status"] = "COMPLETED" if (d.get("actual_qty") or 0) > 0 else "AT_RISK"
        d["material_shortages"] = _get_schedule_shortages(cursor, d)
        return d

def add_schedule(product_id: int, date_str: str, planned_qty: int, actual_qty: int = 0) -> int:
    """Create a plan even when stock is short. Reserve only when every BOM line is available."""
    if planned_qty <= 0:
        raise ValueError("Planned production quantity must be greater than zero.")
    if actual_qty not in (0, None):
        raise ValueError("New production plans must start with zero actual output. Record output when completing production.")

    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
        if not cursor.fetchone():
            raise ValueError(f"Product #{product_id} does not exist.")

        bom_items, total_cost, unit_cost = _estimate_batch_cost(cursor, product_id, planned_qty)
        if not bom_items:
            raise ValueError(
                f"Cannot schedule production: Product #{product_id} has no Bill of Materials (BOM) recipes defined."
            )

        shortages = []
        for item in bom_items:
            state = _available_for_material(cursor, int(item["material_id"]))
            available = float(state["stock_qty"]) - float(state["reserved_qty"])
            required = planned_qty * float(item["qty_required"])
            if available + 1e-9 < required:
                shortages.append(
                    f"{state['material_name']}: need {required:.2f} {state['unit']}, available {available:.2f} {state['unit']}"
                )

        status = "AT_RISK" if shortages else "SCHEDULED"
        cursor.execute(
            """INSERT INTO production_schedule
               (product_id, date, planned_qty, actual_qty, status, total_cost, unit_cost)
               VALUES (?, ?, ?, 0, ?, ?, ?)""",
            (product_id, date_str, planned_qty, status, total_cost, unit_cost),
        )
        schedule_id = cursor.lastrowid

        # All-or-nothing reservations. Short plans remain valid but reserve nothing.
        if not shortages:
            for item in bom_items:
                required = planned_qty * float(item["qty_required"])
                cursor.execute(
                    """INSERT INTO stock_reservations
                       (schedule_id, material_id, reserved_qty, status)
                       VALUES (?, ?, ?, 'ACTIVE')""",
                    (schedule_id, int(item["material_id"]), required),
                )

        return schedule_id


def reserve_schedule(schedule_id: int) -> Dict[str, Any]:
    """Attempt to reserve all current BOM requirements for an AT_RISK plan."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM production_schedule WHERE id = ?", (schedule_id,))
        sched = cursor.fetchone()
        if not sched:
            raise LookupError(f"Production schedule #{schedule_id} not found.")
        if sched["status"] == "SCHEDULED":
            return {"success": True, "schedule_id": schedule_id, "status": "SCHEDULED", "message": "Materials are already reserved."}
        if sched["status"] != "AT_RISK":
            raise ValueError(f"Only AT_RISK plans can reserve materials. Current status: {sched['status']}.")

        planned_qty = int(sched["planned_qty"])
        items, total_cost, unit_cost = _estimate_batch_cost(cursor, int(sched["product_id"]), planned_qty)
        if not items:
            raise ValueError("This product has no BOM. Add at least one BOM line before reserving materials.")

        shortages = []
        for item in items:
            state = _available_for_material(cursor, int(item["material_id"]))
            available = float(state["stock_qty"]) - float(state["reserved_qty"])
            required = planned_qty * float(item["qty_required"])
            if available + 1e-9 < required:
                shortages.append(f"{state['material_name']}: need {required:.2f} {state['unit']}, available {available:.2f} {state['unit']}")
        if shortages:
            raise ValueError("Cannot reserve this plan yet. Shortages: " + "; ".join(shortages))

        for item in items:
            cursor.execute(
                """INSERT INTO stock_reservations
                   (schedule_id, material_id, reserved_qty, status)
                   VALUES (?, ?, ?, 'ACTIVE')""",
                (schedule_id, int(item["material_id"]), planned_qty * float(item["qty_required"])),
            )
        cursor.execute(
            "UPDATE production_schedule SET status = 'SCHEDULED', total_cost = ?, unit_cost = ? WHERE id = ?",
            (total_cost, unit_cost, schedule_id),
        )
        return {"success": True, "schedule_id": schedule_id, "status": "SCHEDULED", "message": "All required materials are now reserved."}

def complete_schedule(schedule_id: int, actual_qty: Optional[int] = None) -> Dict[str, Any]:
    """Complete a fully-reserved plan, deduct actual consumption and freeze costs atomically."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM production_schedule WHERE id = ?", (schedule_id,))
        sched = cursor.fetchone()
        if not sched:
            raise LookupError(f"Production schedule #{schedule_id} not found.")
        if sched["status"] != "SCHEDULED":
            raise ValueError(
                f"Cannot complete run #{schedule_id}: status is '{sched['status']}'. "
                "The plan must be fully reserved before production can be completed."
            )

        planned_qty = int(sched["planned_qty"])
        produced_qty = planned_qty if actual_qty is None else int(actual_qty)
        if produced_qty <= 0:
            raise ValueError("Actual production output must be greater than zero. Cancel the plan if no production took place.")

        cursor.execute(
            """SELECT sr.id AS reservation_id, sr.material_id, sr.reserved_qty,
                      rm.material_name, rm.unit, rm.stock_qty, rm.cost_per_unit
               FROM stock_reservations sr
               JOIN raw_materials rm ON rm.id = sr.material_id
               WHERE sr.schedule_id = ? AND sr.status = 'ACTIVE'""",
            (schedule_id,),
        )
        reservations = [dict(r) for r in cursor.fetchall()]
        if not reservations:
            raise ValueError("This plan has no active material reservations. Reserve materials before completing production.")

        # Validate every material before changing any row. Actual output may exceed plan only if extra stock is free.
        consumption_rows = []
        for res in reservations:
            ratio = float(res["reserved_qty"]) / planned_qty
            consumed = produced_qty * ratio
            state = _available_for_material(cursor, int(res["material_id"]), exclude_schedule_id=schedule_id)
            other_reserved = float(state["reserved_qty"])
            physical = float(res["stock_qty"])
            if physical + 1e-9 < consumed + other_reserved:
                raise ValueError(
                    f"Cannot complete production: insufficient stock for '{res['material_name']}'. "
                    f"Consumption requires {consumed:.2f} {res['unit']}; physical stock is {physical:.2f} "
                    f"and other plans have {other_reserved:.2f} reserved. Update inventory or reduce actual output."
                )
            unit_cost = float(res["cost_per_unit"])
            consumption_rows.append({**res, "consumed_qty": consumed, "unit_cost": unit_cost, "line_cost": consumed * unit_cost})

        # A schedule has one frozen cost snapshot: replace any stale pre-feature draft rows.
        cursor.execute("DELETE FROM production_batch_materials WHERE schedule_id = ?", (schedule_id,))
        total_cost = 0.0
        for item in consumption_rows:
            material_id = int(item["material_id"])
            previous_stock = float(item["stock_qty"])
            new_stock = previous_stock - float(item["consumed_qty"])
            line_cost = float(item["line_cost"])
            total_cost += line_cost

            cursor.execute("UPDATE raw_materials SET stock_qty = ? WHERE id = ?", (new_stock, material_id))
            cursor.execute(
                "UPDATE stock_reservations SET status = 'CONSUMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (item["reservation_id"],),
            )
            cursor.execute(
                """INSERT INTO stock_movements
                   (material_id, movement_type, quantity, previous_stock, new_stock, reason, reference_id)
                   VALUES (?, 'PRODUCTION_CONSUMPTION', ?, ?, ?, ?, ?)""",
                (material_id, item["consumed_qty"], previous_stock, new_stock,
                 f"Production Run #{schedule_id} Completed ({produced_qty} pkts)", schedule_id),
            )
            cursor.execute(
                """INSERT INTO production_batch_materials
                   (schedule_id, material_id, material_name, unit, unit_cost, qty_used, total_cost, snapshot_type)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTUAL')""",
                (schedule_id, material_id, item["material_name"], item["unit"], item["unit_cost"], item["consumed_qty"], line_cost),
            )

        cursor.execute("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?", (produced_qty, int(sched["product_id"])))
        if cursor.rowcount == 0:
            raise ValueError(f"Product #{sched['product_id']} no longer exists.")

        unit_cost = total_cost / produced_qty
        cursor.execute(
            """UPDATE production_schedule
               SET actual_qty = ?, status = 'COMPLETED', total_cost = ?, unit_cost = ?, completed_at = CURRENT_TIMESTAMP
               WHERE id = ? AND status = 'SCHEDULED'""",
            (produced_qty, total_cost, unit_cost, schedule_id),
        )
        if cursor.rowcount != 1:
            raise ValueError("Production status changed during completion. No changes were committed.")

        return {
            "success": True,
            "schedule_id": schedule_id,
            "actual_qty": produced_qty,
            "status": "COMPLETED",
            "total_material_cost": round(total_cost, 2),
            "unit_material_cost": round(unit_cost, 4),
        }

def cancel_schedule(schedule_id: int) -> Dict[str, Any]:
    """Cancel a pending plan and release any reservations without consuming stock."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM production_schedule WHERE id = ?", (schedule_id,))
        sched = cursor.fetchone()
        if not sched:
            raise LookupError(f"Production schedule #{schedule_id} not found.")
        if sched["status"] not in ("SCHEDULED", "AT_RISK"):
            raise ValueError(f"Cannot cancel a run with status '{sched['status']}'. Only pending plans can be cancelled.")
        cursor.execute(
            """UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
               WHERE schedule_id = ? AND status = 'ACTIVE'""",
            (schedule_id,),
        )
        cursor.execute("UPDATE production_schedule SET status = 'CANCELLED' WHERE id = ?", (schedule_id,))
        return {"success": True, "schedule_id": schedule_id, "status": "CANCELLED", "message": "Plan cancelled; any reservations were released."}

def update_schedule(schedule_id: int, date_str: str, planned_qty: int, actual_qty: int = 0) -> bool:
    """Edit a pending plan. If a reserved plan becomes infeasible, release reservations and mark AT_RISK."""
    if planned_qty <= 0:
        raise ValueError("Planned production quantity must be greater than zero.")
    if actual_qty != 0:
        raise ValueError("Actual output can only be entered through the Complete Production action.")
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM production_schedule WHERE id = ?", (schedule_id,))
        sched = cursor.fetchone()
        if not sched:
            return False
        if sched["status"] not in ("SCHEDULED", "AT_RISK"):
            raise ValueError("Only pending production plans can be edited. Completed and cancelled records are historical.")

        product_id = int(sched["product_id"])
        items, total_cost, unit_cost = _estimate_batch_cost(cursor, product_id, planned_qty)
        if not items:
            raise ValueError("This product has no BOM. Add a BOM before editing its production plan.")

        old_status = sched["status"]
        can_reserve = True
        if old_status == "SCHEDULED":
            for item in items:
                state = _available_for_material(cursor, int(item["material_id"]), exclude_schedule_id=schedule_id)
                available = float(state["stock_qty"]) - float(state["reserved_qty"])
                required = planned_qty * float(item["qty_required"])
                if available + 1e-9 < required:
                    can_reserve = False
                    break

        cursor.execute(
            "UPDATE production_schedule SET date = ?, planned_qty = ?, actual_qty = 0, total_cost = ?, unit_cost = ? WHERE id = ?",
            (date_str, planned_qty, total_cost, unit_cost, schedule_id),
        )

        if old_status == "SCHEDULED" and can_reserve:
            cursor.execute(
                "UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE schedule_id = ? AND status = 'ACTIVE'",
                (schedule_id,),
            )
            for item in items:
                cursor.execute(
                    "INSERT INTO stock_reservations (schedule_id, material_id, reserved_qty, status) VALUES (?, ?, ?, 'ACTIVE')",
                    (schedule_id, int(item["material_id"]), planned_qty * float(item["qty_required"])),
                )
            cursor.execute("UPDATE production_schedule SET status = 'SCHEDULED' WHERE id = ?", (schedule_id,))
        else:
            cursor.execute(
                "UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE schedule_id = ? AND status = 'ACTIVE'",
                (schedule_id,),
            )
            cursor.execute("UPDATE production_schedule SET status = 'AT_RISK' WHERE id = ?", (schedule_id,))
        return True

def delete_schedule(schedule_id: int) -> None:
    """Delete only pending/cancelled plans; completed production history is immutable."""
    with get_db() as conn:
        conn.execute("BEGIN IMMEDIATE")
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM production_schedule WHERE id = ?", (schedule_id,))
        row = cursor.fetchone()
        if not row:
            raise LookupError(f"Schedule #{schedule_id} not found.")
        if row["status"] == "COMPLETED":
            raise ValueError("Completed production records cannot be deleted; retain them for audit and costing history.")
        cursor.execute(
            "UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE schedule_id = ? AND status = 'ACTIVE'",
            (schedule_id,),
        )
        cursor.execute("DELETE FROM production_batch_materials WHERE schedule_id = ?", (schedule_id,))
        cursor.execute("DELETE FROM stock_reservations WHERE schedule_id = ?", (schedule_id,))
        cursor.execute("DELETE FROM production_schedule WHERE id = ?", (schedule_id,))

def get_schedule_cost_breakdown(schedule_id: int) -> Dict[str, Any]:
    """Return a live estimate for pending plans and frozen material snapshots for completed batches."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT ps.*, p.name AS product_name, p.packet_size
               FROM production_schedule ps JOIN products p ON p.id = ps.product_id WHERE ps.id = ?""",
            (schedule_id,),
        )
        sched = cursor.fetchone()
        if not sched:
            raise LookupError(f"Production schedule #{schedule_id} not found.")

        if sched["status"] == "COMPLETED":
            cursor.execute(
                """SELECT pbm.*, pbm.unit AS material_unit FROM production_batch_materials pbm
                   WHERE pbm.schedule_id = ? ORDER BY pbm.total_cost DESC""",
                (schedule_id,),
            )
            materials = [dict(r) for r in cursor.fetchall()]
            qty_basis = int(sched["actual_qty"] or 0)
            if materials and all(m.get("snapshot_type") == "ACTUAL" for m in materials):
                cost_type = "ACTUAL_HISTORICAL"
                cost_note = "Actual material consumption and unit costs were snapshotted at completion."
            elif materials:
                cost_type = "LEGACY_UNVERIFIED"
                cost_note = "This is a legacy cost snapshot. Its material quantities/prices could not be verified against a completion movement ledger."
            else:
                cost_type = "HISTORICAL_SNAPSHOT_MISSING"
                cost_note = "No material-level historical snapshot exists for this completed run; an actual cost cannot be reconstructed safely."
        else:
            items, _, _ = _estimate_batch_cost(cursor, int(sched["product_id"]), int(sched["planned_qty"]))
            materials = []
            for item in items:
                qty = int(sched["planned_qty"]) * float(item["qty_required"])
                line_cost = qty * float(item["cost_per_unit"])
                materials.append({
                    "material_id": item["material_id"], "material_name": item["material_name"],
                    "unit": item["unit"], "material_unit": item["unit"],
                    "unit_cost": float(item["cost_per_unit"]), "qty_used": qty,
                    "total_cost": line_cost,
                })
            qty_basis = int(sched["planned_qty"] or 0)
            cost_type = "CURRENT_ESTIMATE"
            cost_note = "Live estimate using the current BOM and current raw-material prices."

        total_cost = sum(float(m["total_cost"]) for m in materials)
        unit_cost = total_cost / qty_basis if qty_basis > 0 else 0.0
        for item in materials:
            item["cost_share_pct"] = round(item["total_cost"] / total_cost * 100, 2) if total_cost else 0.0

        return {
            "schedule_id": sched["id"], "date": sched["date"], "product_id": sched["product_id"],
            "product_name": f"{sched['product_name']} - {sched['packet_size']}g",
            "packet_size": sched["packet_size"], "planned_qty": sched["planned_qty"],
            "actual_qty": sched["actual_qty"], "status": sched["status"],
            "cost_type": cost_type, "cost_note": cost_note,
            "total_material_cost": round(total_cost, 2),
            "unit_material_cost": round(unit_cost, 4), "completed_at": sched["completed_at"],
            "materials": materials,
        }

def get_cost_trends(product_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Returns historical unit cost trends across completed production batches."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                ps.id AS schedule_id,
                ps.date,
                ps.product_id,
                p.name AS product_name,
                p.packet_size,
                ps.actual_qty,
                ps.planned_qty,
                ps.total_cost,
                ps.unit_cost,
                ps.completed_at,
                CASE WHEN EXISTS (
                    SELECT 1 FROM production_batch_materials pbm
                    WHERE pbm.schedule_id = ps.id
                ) AND NOT EXISTS (
                    SELECT 1 FROM production_batch_materials pbm
                    WHERE pbm.schedule_id = ps.id AND pbm.snapshot_type != 'ACTUAL'
                ) THEN 'ACTUAL_HISTORICAL' ELSE 'LEGACY_UNVERIFIED' END AS cost_source
            FROM production_schedule ps
            JOIN products p ON ps.product_id = p.id
            WHERE ps.status = 'COMPLETED'
        """
        params: list = []
        if product_id:
            query += " AND ps.product_id = ?"
            params.append(product_id)
        query += " ORDER BY ps.date ASC, ps.id ASC"

        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        return rows

# --- PRODUCTION & MATERIAL QUERIES ---

def get_filtered_production(product_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Retrieves production records grouped by date or product,
    filtering by optional product_id and date boundaries.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        if product_id:
            query = "SELECT date, planned_qty, actual_qty, status FROM production_schedule WHERE product_id = ? AND status = 'COMPLETED'"
            params: list = [product_id]
            if start_date and end_date:
                query += " AND date BETWEEN ? AND ?"
                params.extend([start_date, end_date])
            elif start_date:
                query += " AND date >= ?"
                params.append(start_date)
            elif end_date:
                query += " AND date <= ?"
                params.append(end_date)
            query += " ORDER BY date ASC"
            cursor.execute(query, tuple(params))
        else:
            query = """
                SELECT
                    date,
                    SUM(planned_qty) AS planned_qty,
                    SUM(actual_qty) AS actual_qty
                FROM production_schedule
                WHERE status = 'COMPLETED'
            """
            params = []
            if start_date and end_date:
                query += " AND date BETWEEN ? AND ?"
                params.extend([start_date, end_date])
            elif start_date:
                query += " AND date >= ?"
                params.append(start_date)
            elif end_date:
                query += " AND date <= ?"
                params.append(end_date)
            query += " GROUP BY date ORDER BY date ASC"
            cursor.execute(query, tuple(params))
        return [dict(row) for row in cursor.fetchall()]

def get_material_requirements(material_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """
    Computes daily gross material requirements based on active production schedule
    and BOM recipe specifications.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT
                ps.date,
                SUM(ps.planned_qty * b.qty_required) AS gross_requirement
            FROM production_schedule ps
            JOIN bom b ON ps.product_id = b.product_id
            WHERE b.material_id = ? AND ps.status IN ('SCHEDULED', 'AT_RISK')
        """
        params: list = [material_id]
        if start_date and end_date:
            query += " AND ps.date BETWEEN ? AND ?"
            params.extend([start_date, end_date])
        elif start_date:
            query += " AND ps.date >= ?"
            params.append(start_date)
        elif end_date:
            query += " AND ps.date <= ?"
            params.append(end_date)
        query += " GROUP BY ps.date ORDER BY ps.date ASC"
        cursor.execute(query, tuple(params))
        return [dict(row) for row in cursor.fetchall()]

def get_dashboard_summary(product_id: Optional[int] = None, material_id: Optional[int] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Calculates overall dashboard metrics, KPI summaries, and performance arrays."""
    products = get_all_products()
    materials = get_all_materials()
    recent_schedules = get_all_schedules()

    records = get_filtered_production(product_id, start_date, end_date)

    selected_product_name = None
    if product_id:
        prod = get_product_by_id(product_id)
        if prod:
            selected_product_name = f"{prod['name']} - {prod['packet_size']}g"

    perf_data = []
    for r in records:
        planned = float(r["planned_qty"] or 0)
        actual = float(r["actual_qty"] or 0)
        variance = actual - planned
        shortfall = max(0.0, planned - actual)
        surplus = max(0.0, actual - planned)
        perf_data.append({
            "date": r["date"],
            "planned_qty": planned,
            "actual_qty": actual,
            "variance": variance,
            "shortfall": shortfall,
            "surplus": surplus,
            "achievement": (actual / planned * 100) if planned > 0 else 0.0,
        })

    target_material_id = material_id or (materials[0]["id"] if materials else None)
    material_perf = None
    if target_material_id:
        mat = get_material_by_id(target_material_id)
        if mat:
            daily_reqs = get_material_requirements(target_material_id, start_date, end_date)
            material_perf = {
                "material_id": mat["id"],
                "material_name": mat["material_name"],
                "unit": mat["unit"],
                "stock_qty": mat["stock_qty"],
                "reserved_qty": mat["reserved_qty"],
                "available_qty": mat["available_qty"],
                "cost_per_unit": mat["cost_per_unit"],
                "daily_requirements": daily_reqs,
            }

    total_planned = sum(p["planned_qty"] for p in perf_data)
    total_actual = sum(p["actual_qty"] for p in perf_data)
    total_shortfall = sum(p["shortfall"] for p in perf_data)
    total_surplus = sum(p["surplus"] for p in perf_data)
    overall_achievement = (total_actual / total_planned * 100) if total_planned > 0 else 0.0
    total_inventory_val = sum(m["stock_qty"] * m["cost_per_unit"] for m in materials)

    # Active reservations count
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM stock_reservations WHERE status = 'ACTIVE'")
        active_reservations_count = cursor.fetchone()[0]

    low_stock_count = sum(1 for m in materials if m["is_low_stock"])

    return {
        "products": products,
        "materials": materials,
        "recent_schedules": recent_schedules,
        "perf_data": perf_data,
        "material_perf": material_perf,
        "selected_product_name": selected_product_name,
        "selected_product_id": product_id,
        "selected_material_id": target_material_id,
        "start_date": start_date,
        "end_date": end_date,
        "total_planned": total_planned,
        "total_actual": total_actual,
        "total_shortfall": total_shortfall,
        "total_surplus": total_surplus,
        "overall_achievement": overall_achievement,
        "total_inventory_val": total_inventory_val,
        "raw_materials_count": len(materials),
        "low_stock_count": low_stock_count,
        "active_reservations_count": active_reservations_count,
    }

def get_material_feasibility_report(start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Report material needs for AT_RISK plans against free stock; reserved plans are not double-counted."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT rm.id, rm.material_name, rm.unit, rm.stock_qty,
                      COALESCE((SELECT SUM(sr.reserved_qty) FROM stock_reservations sr
                                WHERE sr.material_id = rm.id AND sr.status = 'ACTIVE'), 0.0) AS reserved_qty,
                      COALESCE((SELECT SUM(ps.planned_qty * b.qty_required)
                                FROM bom b JOIN production_schedule ps ON ps.product_id = b.product_id
                                WHERE b.material_id = rm.id AND ps.status = 'AT_RISK'
                                  AND ps.date BETWEEN ? AND ?), 0.0) AS required_qty
               FROM raw_materials rm
               ORDER BY rm.material_name ASC""",
            (start_date, end_date),
        )
        rows = cursor.fetchall()

    report = []
    for row in rows:
        physical = float(row["stock_qty"] or 0.0)
        reserved = float(row["reserved_qty"] or 0.0)
        available = physical - reserved
        required = float(row["required_qty"] or 0.0)
        shortage = max(0.0, required - available)
        surplus = max(0.0, available - required)
        if required <= 0:
            status = "No unreserved requirement"
        elif shortage > 1e-6:
            status = "Procurement required"
        elif abs(available - required) <= 1e-6:
            status = "Exactly sufficient - no buffer"
        else:
            status = "Sufficient"
        report.append({
            "material_id": row["id"], "material_name": row["material_name"], "unit": row["unit"],
            "physical_stock": physical, "reserved_stock": reserved, "available_stock": available,
            "required_qty": required, "shortage": shortage, "surplus": surplus,
            "procurement_qty": shortage, "status": status,
        })
    return report

