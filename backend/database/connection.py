import sqlite3
from contextlib import contextmanager
from typing import Generator
import config

def get_db_connection() -> sqlite3.Connection:
    """
    Creates and returns a new SQLite database connection.
    - Path is configured via config.DB_PATH.
    - Foreign-key enforcement is explicitly enabled on every connection.
    - Row factory is set to sqlite3.Row for dictionary-like column access.
    """
    config.validate_database_exists()
    conn = sqlite3.connect(str(config.DB_PATH), timeout=10.0)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager for safe connection and transaction handling.
    Automatically commits on success or rolls back on exception,
    then closes the connection cleanly.
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def check_schema_compatibility() -> dict:
    """
    Inspects the configured database to ensure required MRP tables exist.
    Runs safe migrations if tables or columns are missing.
    Returns status and list of present/missing tables.
    """
    from .migrate import run_migrations
    try:
        run_migrations(config.DB_PATH)
    except Exception as e:
        print(f"[Warning] Auto-migration check: {e}")

    required_tables = [
        "raw_materials",
        "products",
        "bom",
        "production_schedule",
        "production_batch_materials",
        "stock_movements",
        "stock_reservations",
    ]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = [row["name"] for row in cursor.fetchall()]

    missing_tables = [t for t in required_tables if t not in existing_tables]
    is_compatible = len(missing_tables) == 0

    return {
        "compatible": is_compatible,
        "database_path": str(config.DB_PATH),
        "existing_tables": existing_tables,
        "missing_tables": missing_tables,
    }
