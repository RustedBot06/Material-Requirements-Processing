import database

def calculate_performance(records):
    result = []

    for record in records:
        planned = record["planned_qty"]
        actual = record["actual_qty"]

        result.append({
            "date": record["date"],
            "planned_qty": planned,
            "actual_qty": actual,
            "shortfall": planned - actual,
            "achievement": (actual / planned) * 100 if planned != 0 else None
        })

    return result

import database

def get_product_performance(product_id):
    records = database.get_product_production(product_id)
    return calculate_performance(records)

def get_gross_performance():
    records = database.get_gross_production()
    return calculate_performance(records)

def get_material_performance(material_id):

    material = database.get_row_rm(material_id)

    if material is None:
        return None

    records = database.get_material_requirement(material_id)

    return {
        "material_name": material["material_name"],
        "unit": material["unit"],
        "stock_qty": material["stock_qty"],
        "daily_requirements": records
    }


def get_material_feasibility(start_date, end_date):

    records = database.get_material_feasibility_data(
        start_date,
        end_date
    )

    report = []

    for record in records:

        required = record["required_qty"] or 0
        available = record["stock_qty"] or 0

        shortage = max(0, required - available)
        surplus = max(0, available - required)

        if required == 0:
            status = "No pending requirement"

        elif shortage > 0.000001:
            status = "Procurement required"

        elif abs(available - required) <= 0.000001:
            status = "Exactly sufficient - no buffer"

        else:
            status = "Sufficient"

        report.append({
            "material_id": record["id"],
            "material_name": record["material_name"],
            "unit": record["unit"],
            "available_stock": available,
            "required_qty": required,
            "shortage": shortage,
            "surplus": surplus,
            "procurement_qty": shortage,
            "status": status
        })

    return report


