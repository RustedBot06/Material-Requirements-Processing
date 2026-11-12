import os
from pathlib import Path

# Base directories
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Configurable SQLite Database Path
# Default location: backend/database/chips_mrp.db
# Can be overridden via environment variable CHIPS_MRP_DB_PATH
DEFAULT_DB_PATH = BACKEND_DIR / "database" / "chips_mrp.db"
DB_PATH = Path(os.environ.get("CHIPS_MRP_DB_PATH", DEFAULT_DB_PATH)).resolve()

# Fallback check if user places chips_mrp.db in project root
if not DB_PATH.exists() and (PROJECT_ROOT / "chips_mrp.db").exists():
    DB_PATH = (PROJECT_ROOT / "chips_mrp.db").resolve()

# Server Settings
HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
PORT = int(os.environ.get("FLASK_PORT", 5000))
SECRET_KEY = os.environ.get("SECRET_KEY", "chips-mrp-industrial-audit-key-2026")
DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1", "yes")

# CORS Settings
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

def validate_database_exists():
    """
    Checks that the configured database exists.
    Per architecture requirements, do NOT automatically overwrite, delete,
    or silently create a blank database when the configured database is missing.
    """
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"Configured database file not found at: {DB_PATH}\n"
            "Please ensure a valid SQLite database with the expected schema exists, "
            "or set the CHIPS_MRP_DB_PATH environment variable."
        )
