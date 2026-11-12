from flask import Blueprint, request, jsonify
from services.analytics import (
    get_production_comparison_data,
    get_production_shortfall_data,
    get_material_inventory_data,
)
from utils.validators import validate_date_range

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics/production-comparison", methods=["GET"])
def production_comparison():
    """
    Graph 1: Planned vs Actual Production
    Parameters:
    - product_id (int, optional)
    - start_date (YYYY-MM-DD, optional)
    - end_date (YYYY-MM-DD, optional)
    """
    product_id = request.args.get("product_id", type=int)
    start_date = request.args.get("start_date") or None
    end_date = request.args.get("end_date") or None

    valid, err_msg = validate_date_range(start_date, end_date)
    if not valid:
        return jsonify({"error": err_msg}), 400

    data = get_production_comparison_data(
        product_id=product_id,
        start_date=start_date,
        end_date=end_date,
    )
    return jsonify(data)

@analytics_bp.route("/analytics/production-shortfall", methods=["GET"])
def production_shortfall():
    """
    Graph 2: Actual Production vs Production Shortfall
    Parameters:
    - product_id (int, optional)
    - start_date (YYYY-MM-DD, optional)
    - end_date (YYYY-MM-DD, optional)
    """
    product_id = request.args.get("product_id", type=int)
    start_date = request.args.get("start_date") or None
    end_date = request.args.get("end_date") or None

    valid, err_msg = validate_date_range(start_date, end_date)
    if not valid:
        return jsonify({"error": err_msg}), 400

    data = get_production_shortfall_data(
        product_id=product_id,
        start_date=start_date,
        end_date=end_date,
    )
    return jsonify(data)

@analytics_bp.route("/analytics/material-inventory", methods=["GET"])
def material_inventory():
    """
    Graph 3: Raw Material Procurement vs Remaining Stock
    Parameters:
    - material_id (int, optional)
    - start_date (YYYY-MM-DD, optional)
    - end_date (YYYY-MM-DD, optional)
    """
    material_id = request.args.get("material_id", type=int)
    start_date = request.args.get("start_date") or None
    end_date = request.args.get("end_date") or None

    valid, err_msg = validate_date_range(start_date, end_date)
    if not valid:
        return jsonify({"error": err_msg}), 400

    data = get_material_inventory_data(
        material_id=material_id,
        start_date=start_date,
        end_date=end_date,
    )
    return jsonify(data)
