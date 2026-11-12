"""
Centralized SQLite database connection management.
Enforces foreign-key constraints on every connection and provides row mapping.
"""
from .connection import get_db_connection, get_db, check_schema_compatibility

__all__ = ["get_db_connection", "get_db", "check_schema_compatibility"]
