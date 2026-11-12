from datetime import date as Date
from typing import Tuple, Optional, Any, Dict

def validate_material_data(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validates material registration/update payload.
    Requirements:
    - material_name: non-empty string
    - unit: non-empty string
    - stock_qty: non-negative float
    - cost_per_unit: non-negative float
    - min_stock_threshold: non-negative float (optional, defaults to 0.0)
    """
    name = str(data.get("material_name", "")).strip()
    unit = str(data.get("unit", "")).strip()

    if not name:
        return False, "Material name is required.", None
    if not unit:
        return False, "Unit of measurement is required (e.g. kg, L, pcs).", None

    try:
        stock_qty = float(data.get("stock_qty", 0))
        cost_per_unit = float(data.get("cost_per_unit", 0))
        min_stock_threshold = float(data.get("min_stock_threshold", 0))
    except (ValueError, TypeError):
        return False, "Stock quantity, unit cost, and minimum threshold must be valid numerical values.", None

    if stock_qty < 0:
        return False, "Stock quantity cannot be negative.", None
    if cost_per_unit < 0:
        return False, "Cost per unit cannot be negative.", None
    if min_stock_threshold < 0:
        return False, "Minimum stock threshold cannot be negative.", None

    return True, None, {
        "material_name": name,
        "unit": unit,
        "stock_qty": stock_qty,
        "cost_per_unit": cost_per_unit,
        "min_stock_threshold": min_stock_threshold,
    }

def validate_stock_adjustment(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validates manual stock adjustment payload.
    Requirements:
    - adjustment_type: 'INCREASE' or 'DECREASE'
    - quantity: positive float (> 0)
    - reason: non-empty string
    """
    adj_type = str(data.get("adjustment_type", "")).strip().upper()
    reason = str(data.get("reason", "")).strip()

    if adj_type not in ("INCREASE", "DECREASE", "ADD", "SUBTRACT"):
        return False, "Adjustment type must be 'INCREASE' or 'DECREASE'.", None

    if not reason:
        return False, "A reason is mandatory for every stock adjustment.", None

    try:
        quantity = float(data.get("quantity", 0))
    except (ValueError, TypeError):
        return False, "Quantity must be a valid positive number.", None

    if quantity <= 0:
        return False, "Adjustment quantity must be greater than zero.", None

    return True, None, {
        "adjustment_type": "INCREASE" if adj_type in ("INCREASE", "ADD") else "DECREASE",
        "quantity": quantity,
        "reason": reason,
    }

def validate_product_data(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validates product registration/update payload.
    Requirements:
    - name: non-empty string
    - packet_size: positive integer
    - stock_qty: non-negative integer
    - mrp: non-negative float
    """
    name = str(data.get("name", "")).strip()
    if not name:
        return False, "Product name is required.", None

    try:
        packet_size = int(data.get("packet_size", 0))
        stock_qty = int(data.get("stock_qty", 0))
        mrp = float(data.get("mrp", 0))
    except (ValueError, TypeError):
        return False, "Packet size, stock quantity, and MRP must be valid numbers.", None

    if packet_size <= 0:
        return False, "Packet size must be a positive integer (e.g. 25g, 50g).", None
    if stock_qty < 0:
        return False, "Stock quantity cannot be negative.", None
    if mrp < 0:
        return False, "Product MRP cannot be negative.", None

    return True, None, {
        "name": name,
        "packet_size": packet_size,
        "stock_qty": stock_qty,
        "mrp": mrp,
    }

def validate_bom_data(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validates BOM entry creation/update payload.
    Requirements:
    - product_id: positive integer
    - material_id: positive integer
    - qty_required: positive float
    """
    try:
        product_id = int(data.get("product_id", 0))
        material_id = int(data.get("material_id", 0))
        qty_required = float(data.get("qty_required", 0))
    except (ValueError, TypeError):
        return False, "Product ID, Material ID, and Quantity Required must be valid numbers.", None

    if product_id <= 0:
        return False, "Valid Product must be selected.", None
    if material_id <= 0:
        return False, "Valid Raw Material must be selected.", None
    if qty_required <= 0:
        return False, "Quantity required per packet must be strictly greater than zero.", None

    return True, None, {
        "product_id": product_id,
        "material_id": material_id,
        "qty_required": qty_required,
    }

def validate_schedule_data(data: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Validates production schedule entry payload.
    Requirements:
    - product_id: positive integer
    - date: valid ISO date string (YYYY-MM-DD)
    - planned_qty: non-negative integer
    - actual_qty: non-negative integer
    """
    date_str = str(data.get("date", "")).strip()
    if not date_str:
        return False, "Production date is required.", None

    try:
        Date.fromisoformat(date_str)
    except ValueError:
        return False, "Date must be in valid ISO format (YYYY-MM-DD).", None

    try:
        product_id = int(data.get("product_id", 0))
        planned_qty = int(data.get("planned_qty", 0))
        actual_qty = int(data.get("actual_qty", 0))
    except (ValueError, TypeError):
        return False, "Product ID, Planned Quantity, and Actual Quantity must be valid integers.", None

    if product_id <= 0:
        return False, "Valid Product must be selected.", None
    if planned_qty < 0:
        return False, "Planned production quantity cannot be negative.", None
    if actual_qty < 0:
        return False, "Actual production quantity cannot be negative.", None

    return True, None, {
        "product_id": product_id,
        "date": date_str,
        "planned_qty": planned_qty,
        "actual_qty": actual_qty,
    }

def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validates start and end date parameters.
    """
    if start_date:
        try:
            d_start = Date.fromisoformat(start_date)
        except ValueError:
            return False, "Invalid start_date format. Expected YYYY-MM-DD."
    else:
        d_start = None

    if end_date:
        try:
            d_end = Date.fromisoformat(end_date)
        except ValueError:
            return False, "Invalid end_date format. Expected YYYY-MM-DD."
    else:
        d_end = None

    if d_start and d_end and d_start > d_end:
        return False, "Start date cannot be after end date."

    return True, None
