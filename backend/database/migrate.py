"""
Database safe migration script for Chips MRP.
Incremental, backward-compatible schema updates preserving existing records and data integrity.
"""
import sqlite3
import sys
from pathlib import Path

# Resolve DB path
DEFAULT_DB_PATH = Path(__file__).resolve().parent / "chips_mrp.db"

def run_migrations(target_db_path=None):
    active_path = Path(target_db_path) if target_db_path else DEFAULT_DB_PATH
    if not active_path.exists():
        raise FileNotFoundError(f"Database not found at {active_path}")

    print(f"[Migration] Connecting to database: {active_path}")
    conn = sqlite3.connect(str(active_path))
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    try:
        conn.execute("BEGIN TRANSACTION;")

        # 1. Update raw_materials table
        cursor.execute("PRAGMA table_info(raw_materials);")
        rm_cols = [c[1] for c in cursor.fetchall()]

        if "min_stock_threshold" not in rm_cols:
            print("[Migration] Adding min_stock_threshold column to raw_materials...")
            cursor.execute("ALTER TABLE raw_materials ADD COLUMN min_stock_threshold REAL DEFAULT 0.0;")
            # Set sensible initial thresholds for existing items if they are 0
            cursor.execute("UPDATE raw_materials SET min_stock_threshold = 200.0 WHERE id = 12;") # Potatoes
            cursor.execute("UPDATE raw_materials SET min_stock_threshold = 100.0 WHERE id = 13;") # Oil
            cursor.execute("UPDATE raw_materials SET min_stock_threshold = 25.0 WHERE id = 14;")  # Salt
            cursor.execute("UPDATE raw_materials SET min_stock_threshold = 2000.0 WHERE id = 15;") # Pouches

        # 2. Create stock_movements table
        print("[Migration] Ensuring stock_movements table exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                material_id INTEGER NOT NULL,
                movement_type TEXT NOT NULL,
                quantity REAL NOT NULL,
                previous_stock REAL NOT NULL,
                new_stock REAL NOT NULL,
                reason TEXT NOT NULL,
                reference_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (material_id) REFERENCES raw_materials(id)
            );
        """)

        # 3. Create stock_reservations table
        print("[Migration] Ensuring stock_reservations table exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stock_reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_id INTEGER NOT NULL,
                material_id INTEGER NOT NULL,
                reserved_qty REAL NOT NULL,
                status TEXT DEFAULT 'ACTIVE',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (schedule_id) REFERENCES production_schedule(id) ON DELETE CASCADE,
                FOREIGN KEY (material_id) REFERENCES raw_materials(id)
            );
        """)

        # 4. Update production_schedule table
        cursor.execute("PRAGMA table_info(production_schedule);")
        ps_cols = [c[1] for c in cursor.fetchall()]

        if "status" not in ps_cols:
            print("[Migration] Adding status column to production_schedule...")
            cursor.execute("ALTER TABLE production_schedule ADD COLUMN status TEXT DEFAULT 'AT_RISK';")
            # Legacy rows with actual output are treated as completed; uncompleted legacy plans
            # are AT_RISK until stock is checked and explicitly reserved.
            cursor.execute("UPDATE production_schedule SET status = CASE WHEN actual_qty > 0 THEN 'COMPLETED' ELSE 'AT_RISK' END WHERE status IS NULL OR status = 'AT_RISK';")

        if "total_cost" not in ps_cols:
            print("[Migration] Adding total_cost column to production_schedule...")
            cursor.execute("ALTER TABLE production_schedule ADD COLUMN total_cost REAL DEFAULT 0.0;")

        if "unit_cost" not in ps_cols:
            print("[Migration] Adding unit_cost column to production_schedule...")
            cursor.execute("ALTER TABLE production_schedule ADD COLUMN unit_cost REAL DEFAULT 0.0;")

        if "created_at" not in ps_cols:
            print("[Migration] Adding created_at column to production_schedule...")
            cursor.execute("ALTER TABLE production_schedule ADD COLUMN created_at TEXT DEFAULT '';")
            cursor.execute("UPDATE production_schedule SET created_at = date || ' 09:00:00' WHERE created_at = '' OR created_at IS NULL;")

        if "completed_at" not in ps_cols:
            print("[Migration] Adding completed_at column to production_schedule...")
            cursor.execute("ALTER TABLE production_schedule ADD COLUMN completed_at TEXT;")
            # For existing completed runs, set completed_at to date || ' 18:00:00'
            cursor.execute("UPDATE production_schedule SET completed_at = date || ' 18:00:00' WHERE completed_at IS NULL AND actual_qty > 0;")

        # 5. Create production_batch_materials table
        print("[Migration] Ensuring production_batch_materials table exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS production_batch_materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                schedule_id INTEGER NOT NULL,
                material_id INTEGER NOT NULL,
                material_name TEXT NOT NULL,
                unit TEXT NOT NULL,
                unit_cost REAL NOT NULL,
                qty_used REAL NOT NULL,
                total_cost REAL NOT NULL,
                FOREIGN KEY (schedule_id) REFERENCES production_schedule(id) ON DELETE CASCADE,
                FOREIGN KEY (material_id) REFERENCES raw_materials(id)
            );
        """)

        # Mark pre-existing batch cost rows as unverified legacy snapshots. New completion
        # events explicitly write snapshot_type='ACTUAL'.
        cursor.execute("PRAGMA table_info(production_batch_materials);")
        pbm_cols = [c[1] for c in cursor.fetchall()]
        if "snapshot_type" not in pbm_cols:
            cursor.execute(
                "ALTER TABLE production_batch_materials ADD COLUMN snapshot_type TEXT NOT NULL DEFAULT 'LEGACY_UNVERIFIED';"
            )

        # 5a. A plan labelled SCHEDULED must have a complete active reservation set.
        # Older builds could leave a plan marked scheduled without actually reserving stock.
        cursor.execute(
            "SELECT id, product_id, planned_qty FROM production_schedule WHERE status = 'SCHEDULED' AND COALESCE(actual_qty, 0) = 0"
        )
        for schedule_id, product_id, planned_qty in cursor.fetchall():
            cursor.execute(
                "SELECT material_id, SUM(qty_required) FROM bom WHERE product_id = ? GROUP BY material_id",
                (product_id,),
            )
            expected = {int(r[0]): float(planned_qty) * float(r[1]) for r in cursor.fetchall()}
            cursor.execute(
                "SELECT material_id, SUM(reserved_qty) FROM stock_reservations WHERE schedule_id = ? AND status = 'ACTIVE' GROUP BY material_id",
                (schedule_id,),
            )
            active = {int(r[0]): float(r[1]) for r in cursor.fetchall()}
            reservation_matches = bool(expected) and expected.keys() == active.keys() and all(
                abs(expected[mid] - active[mid]) <= 1e-6 for mid in expected
            )
            if not reservation_matches:
                cursor.execute(
                    "UPDATE stock_reservations SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP WHERE schedule_id = ? AND status = 'ACTIVE'",
                    (schedule_id,),
                )
                cursor.execute("UPDATE production_schedule SET status = 'AT_RISK' WHERE id = ?", (schedule_id,))

        # 6. Do not fabricate historical batch costs from the current BOM and prices.
        # Historical production_batch_materials rows are written only when a batch is
        # actually completed. Existing records are preserved as-is.

        # 7. Seed initial baseline stock movement for each raw material if empty
        cursor.execute("SELECT COUNT(*) FROM stock_movements;")
        sm_count = cursor.fetchone()[0]
        if sm_count == 0:
            print("[Migration] Populating initial stock movements ledger...")
            cursor.execute("SELECT id, material_name, stock_qty FROM raw_materials;")
            materials = cursor.fetchall()
            for mat in materials:
                m_id, m_name, s_qty = mat
                cursor.execute("""
                    INSERT INTO stock_movements (material_id, movement_type, quantity, previous_stock, new_stock, reason, created_at)
                    VALUES (?, 'INITIAL_BALANCE', ?, 0, ?, 'Initial inventory baseline', CURRENT_TIMESTAMP)
                """, (m_id, s_qty, s_qty))

        conn.commit()
        print("[Migration] Migration successfully completed and committed!")

    except Exception as e:
        conn.rollback()
        print(f"[Migration ERROR] Migration rolled back due to error: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
