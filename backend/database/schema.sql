
PRAGMA foreign_keys = ON;

CREATE TABLE raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock_qty REAL DEFAULT 0,
    cost_per_unit REAL NOT NULL,
    min_stock_threshold REAL DEFAULT 0.0
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    packet_size INTEGER NOT NULL,
    stock_qty INTEGER NOT NULL,
    mrp REAL NOT NULL
);

CREATE TABLE bom (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    qty_required REAL NOT NULL,
    cost REAL NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY(material_id) REFERENCES raw_materials(id) ON DELETE RESTRICT,
    UNIQUE(product_id, material_id)
);

CREATE TABLE production_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    planned_qty INTEGER NOT NULL CHECK(planned_qty >= 0),
    actual_qty INTEGER NOT NULL DEFAULT 0 CHECK(actual_qty >= 0),
    status TEXT DEFAULT 'COMPLETED',
    total_cost REAL DEFAULT 0.0,
    unit_cost REAL DEFAULT 0.0,
    created_at TEXT DEFAULT '',
    completed_at TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,
    UNIQUE(product_id, date)
);

CREATE TABLE production_batch_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    material_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    unit_cost REAL NOT NULL,
    qty_used REAL NOT NULL,
    total_cost REAL NOT NULL,
    snapshot_type TEXT NOT NULL DEFAULT 'LEGACY_UNVERIFIED',
    FOREIGN KEY(schedule_id) REFERENCES production_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY(material_id) REFERENCES raw_materials(id)
);

CREATE TABLE stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    previous_stock REAL NOT NULL,
    new_stock REAL NOT NULL,
    reason TEXT NOT NULL,
    reference_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(material_id) REFERENCES raw_materials(id)
);

CREATE TABLE stock_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    reserved_qty REAL NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(schedule_id) REFERENCES production_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY(material_id) REFERENCES raw_materials(id)
);
