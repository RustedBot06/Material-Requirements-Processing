import sqlite3
from pathlib import Path

base_directory=Path(__file__).resolve().parent
db_path=base_directory/"chips_mrp.db"

def db_connector():
    mydb=sqlite3.connect(db_path)
    mydb.execute("PRAGMA foreign_keys = ON")
    mydb.row_factory=sqlite3.Row
    return mydb

def db_ini():
    conn=db_connector()
    cursor=conn.cursor()
    
    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS raw_materials(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    material_name TEXT NOT NULL,
                    unit TEXT NOT NULL,
                    stock_qty REAL DEFAULT 0,
                    cost_per_unit REAL NOT NULL)
                    """)
    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS products(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    packet_size INTEGER NOT NULL,
                    stock_qty INTEGER NOT NULL,
                    mrp REAL NOT NULL)
                    """)
    cursor.execute("""
                    CREATE TABLE IF NOT EXISTS bom(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    material_id INTEGER NOT NULL,
                    qty_required REAL NOT NULL,
                    cost REAL NOT NULL,

                    FOREIGN KEY(product_id)
                    REFERENCES products(id) ON DELETE RESTRICT,

                    FOREIGN KEY(material_id)
                    REFERENCES raw_materials(id) ON DELETE RESTRICT,

                    UNIQUE(product_id, material_id))
                    """)
    cursor.execute("""CREATE TABLE IF NOT EXISTS production_schedule(
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        product_id INTEGER NOT NULL,
                        date TEXT NOT NULL,
                        planned_qty INTEGER NOT NULL CHECK(planned_qty>=0),
                        actual_qty INTEGER NOT NULL DEFAULT 0 CHECK(actual_qty>=0),
                        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,
                        UNIQUE(product_id,date))""")
    conn.commit()
    conn.close()

#----Functions for raw_materials----
#rm means raw_materials
def add_rm(material_name,unit,stock_qty,cost_p_unit):
    conn=db_connector() #implicit cursor creation and execution
    conn.execute("""
                INSERT INTO raw_materials
                (material_name,unit,stock_qty,cost_per_unit)
                VALUES(?,?,?,?) """,
                (material_name,unit,stock_qty,cost_p_unit))
    conn.commit()
    conn.close()

def getall_rm():
    conn=db_connector()
    materials=conn.execute("""SELECT * FROM raw_materials ORDER BY id""").fetchall()
    #materials = [(,),(,)] or []
    conn.close()
    return materials

def update_rm(id, material_name, unit, stock_qty, cost_per_unit):
    conn = db_connector()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE raw_materials
            SET material_name=?,
                unit=?,
                stock_qty=?,
                cost_per_unit=?
            WHERE id=?
        """, (material_name, unit, stock_qty, cost_per_unit, id))

        if cursor.rowcount == 0:
            conn.rollback()
            return 0

        # Recalculate costs of all BOM entries using this material
        cursor.execute("""
            UPDATE bom
            SET cost = qty_required * ?
            WHERE material_id=?
        """, (cost_per_unit, id))

        conn.commit()
        return 1

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

def get_row_rm(id):
    conn=db_connector()
    material_row=conn.execute("""SELECT * FROM raw_materials WHERE id=?""",(id,)).fetchone()
    #returns ()
    conn.close()
    return material_row

def delete_row_rm(id):
    conn=db_connector()
    cursor=conn.cursor()
    cursor.execute("DELETE FROM raw_materials WHERE id=?",(id,))
    #returns ()
    conn.commit()
    conn.close()
    return cursor.rowcount


#----functions for products----
def add_prod(name,packet_size,stock_qty,mrp):
    conn=db_connector()
    cursor=conn.cursor()
    cursor.execute("""
                INSERT INTO products 
                (name,packet_size,stock_qty,mrp)
                VALUES (?,?,?,?)""",(name,packet_size,stock_qty,mrp))
    conn.commit()
    conn.close()

def getall_prods():
    conn=db_connector()
    cursor=conn.cursor()
    prods=cursor.execute("""SELECT * FROM products ORDER BY id""").fetchall()
    #materials = [(,),(,)] or []
    conn.close()
    return prods

def update_prods(id,name,packet_size,stock_qty,mrp):
    conn=db_connector()
    crsr=conn.cursor()
    crsr.execute("""UPDATE products SET 
                 name=?,
                 packet_size=?,
                 stock_qty=?,
                 mrp= ? 
                 WHERE id = ?""",(name,packet_size,stock_qty,mrp,id))
    conn.commit()
    conn.close()

def get_row_prods(id):
    conn=db_connector()
    crsr=conn.cursor()
    prod_row=crsr.execute("""SELECT * FROM products WHERE id=?""",(id,)).fetchone()
    #returns ()
    conn.close()
    return prod_row

def delete_row_prods(id):
    conn=db_connector()
    cursor=conn.cursor()
    cursor.execute("DELETE FROM products WHERE id=?",(id,))
    #returns ()
    conn.commit()
    conn.close()
    return cursor.rowcount

#----BOM Functions----
def add_bom(product_id, material_id, qty_required):
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT cost_per_unit
        FROM raw_materials
        WHERE id=?
    """, (material_id,))

    material = cursor.fetchone()

    if material is None:
        conn.close()
        raise ValueError("Raw material not found.")

    cost = qty_required * material["cost_per_unit"]

    cursor.execute("""
        INSERT INTO bom
        (product_id, material_id, qty_required, cost)
        VALUES (?, ?, ?, ?)
    """, (product_id, material_id, qty_required, cost))

    conn.commit()
    conn.close()

def getall_bom():
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            bom.*,
            products.name AS product_name,
            products.packet_size AS packet_size,
            raw_materials.material_name,
            raw_materials.unit,
            raw_materials.cost_per_unit
        FROM bom
        JOIN products
            ON bom.product_id = products.id
        JOIN raw_materials
            ON bom.material_id = raw_materials.id
        ORDER BY bom.id
    """)

    bom_entries = cursor.fetchall()
    conn.close()

    return bom_entries

def get_row_bom(id):
    conn = db_connector()
    crsr = conn.cursor()

    bom_row = crsr.execute("""
        SELECT
            bom.*,
            products.name AS product_name,
            products.packet_size AS packet_size,
            raw_materials.material_name,
            raw_materials.cost_per_unit
        FROM bom
        JOIN products
            ON bom.product_id = products.id
        JOIN raw_materials
            ON bom.material_id = raw_materials.id
        WHERE bom.id=?
    """, (id,)).fetchone()

    conn.close()
    return bom_row

def update_bom(id, qty_req):
    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        UPDATE bom
        SET
            qty_required=?,
            cost=? * (
                SELECT cost_per_unit
                FROM raw_materials
                WHERE id=bom.material_id
            )
        WHERE id=?
    """, (qty_req, qty_req, id))

    conn.commit()
    conn.close()

def delete_row_bom(id):
    conn=db_connector()
    crsr=conn.cursor()
    crsr.execute("""DELETE FROM bom WHERE id=?""",(id,))
    deleted=crsr.rowcount
    conn.commit()
    conn.close()

#----production_schedule----
def add_production(product_id, production_date, planned_qty, actual_qty):
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO production_schedule
        (product_id, date, planned_qty, actual_qty)
        VALUES (?, ?, ?, ?)""", (product_id, production_date, planned_qty, actual_qty))

    conn.commit()
    conn.close()

def getall_production():
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            production_schedule.*,
            products.name AS product_name,
            products.packet_size
        FROM production_schedule
        JOIN products
            ON production_schedule.product_id = products.id
        ORDER BY date DESC
    """)

    records = cursor.fetchall()
    conn.close()

    return records

def get_row_production(id):
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            production_schedule.*,
            products.name AS product_name,
            products.packet_size
        FROM production_schedule
        JOIN products
            ON production_schedule.product_id = products.id
        WHERE production_schedule.id = ?
    """, (id,))

    record = cursor.fetchone()
    conn.close()

    return record

def update_production(id, production_date, planned_qty, actual_qty):
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE production_schedule
        SET date = ?,
            planned_qty = ?,
            actual_qty = ?
        WHERE id = ?
    """, (production_date, planned_qty, actual_qty, id))

    conn.commit()
    conn.close()

def delete_row_production(id):
    conn = db_connector()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM production_schedule
        WHERE id = ?
    """, (id,))

    deleted = cursor.rowcount

    conn.commit()
    conn.close()

    return deleted

#----other funcs----
def get_production_dates():
    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        SELECT DISTINCT date
        FROM production_schedule
        ORDER BY date
    """)

    dates = crsr.fetchall()
    conn.close()
    return dates

def get_product_production(product_id): #qty by product
    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        SELECT
            date,
            planned_qty,
            actual_qty
        FROM production_schedule
        WHERE product_id = ?
        ORDER BY date
    """, (product_id,))

    records = crsr.fetchall()
    conn.close()
    return records

def get_gross_production():#This is in packets gross planned and actual
    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        SELECT
            date,
            SUM(planned_qty) AS planned_qty,
            SUM(actual_qty) AS actual_qty
        FROM production_schedule
        GROUP BY date
        ORDER BY date
    """)

    records = crsr.fetchall()
    conn.close()
    return records

def get_material_requirement(material_id):
    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        SELECT
            ps.date,
            SUM(ps.actual_qty * b.qty_required) AS gross_requirement
        FROM production_schedule ps
        JOIN bom b
            ON ps.product_id = b.product_id
        WHERE b.material_id = ?
        GROUP BY ps.date
        ORDER BY ps.date
    """, (material_id,))

    records = crsr.fetchall()
    conn.close()
    return records

def get_material_feasibility_data(start_date, end_date):

    conn = db_connector()
    crsr = conn.cursor()

    crsr.execute("""
        SELECT
            rm.id,
            rm.material_name,
            rm.unit,
            rm.stock_qty,

            COALESCE(
                SUM(
                    CASE
                        WHEN ps.id IS NOT NULL THEN
                            MAX(ps.planned_qty - ps.actual_qty, 0)
                            * b.qty_required
                        ELSE 0
                    END
                ),
                0
            ) AS required_qty

        FROM raw_materials rm

        LEFT JOIN bom b
            ON rm.id = b.material_id

        LEFT JOIN production_schedule ps
            ON b.product_id = ps.product_id
            AND ps.date BETWEEN ? AND ?

        GROUP BY
            rm.id,
            rm.material_name,
            rm.unit,
            rm.stock_qty

        ORDER BY rm.material_name
    """, (start_date, end_date))

    records = crsr.fetchall()

    conn.close()

    return records

