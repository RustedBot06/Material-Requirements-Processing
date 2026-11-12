from flask import Blueprint, request, jsonify
from services.inventory import (
    get_all_materials,
    get_material_by_id,
    add_material,
    update_material,
    delete_material,
    adjust_stock,
    get_stock_movements,
    get_low_stock_alerts,
    get_reorder_suggestions,
)
from utils.validators import validate_material_data, validate_stock_adjustment

materials_bp = Blueprint("materials", __name__)

@materials_bp.route("/materials", methods=["GET"])
def list_materials():
    materials = get_all_materials()
    return jsonify(materials)

@materials_bp.route("/materials/alerts", methods=["GET"])
def list_low_stock_alerts():
    """Returns low-stock alerts based on available stock and minimum safety thresholds."""
    alerts = get_low_stock_alerts()
    return jsonify(alerts)

@materials_bp.route("/materials/reorder-suggestions", methods=["GET"])
def list_reorder_suggestions():
    """Returns reorder recommendations accounting for physical, reserved, and threshold stock."""
    suggestions = get_reorder_suggestions()
    return jsonify(suggestions)

@materials_bp.route("/materials/movements", methods=["GET"])
def list_all_stock_movements():
    """Returns recent stock movement history across all materials."""
    material_id = request.args.get("material_id", type=int)
    limit = request.args.get("limit", default=100, type=int)
    movements = get_stock_movements(material_id=material_id, limit=limit)
    return jsonify(movements)

@materials_bp.route("/materials/<int:material_id>", methods=["GET"])
def get_material(material_id: int):
    material = get_material_by_id(material_id)
    if not material:
        return jsonify({"error": f"Material #{material_id} not found."}), 404
    return jsonify(material)

@materials_bp.route("/materials/<int:material_id>/movements", methods=["GET"])
def get_material_movements(material_id: int):
    """Returns movement history for a specific raw material."""
    limit = request.args.get("limit", default=50, type=int)
    movements = get_stock_movements(material_id=material_id, limit=limit)
    return jsonify(movements)

@materials_bp.route("/materials/<int:material_id>/adjust", methods=["POST"])
def adjust_material_stock(material_id: int):
    """
    Manual stock adjustment (Increase or Decrease) with reason.
    Prevents negative stock and logs movement in atomic transaction.
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_stock_adjustment(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    try:
        result = adjust_stock(
            material_id=material_id,
            adjustment_type=clean_data["adjustment_type"],
            quantity=clean_data["quantity"],
            reason=clean_data["reason"],
        )
        return jsonify({
            "success": True,
            "message": (
                f"Successfully adjusted stock for {result['material_name']}: "
                f"{'+' if clean_data['adjustment_type'] == 'INCREASE' else '-'}{clean_data['quantity']} {result['unit']}."
            ),
            "data": result,
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to record stock adjustment: {str(e)}"}), 500

@materials_bp.route("/materials", methods=["POST"])
def create_material():
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_material_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    new_id = add_material(
        material_name=clean_data["material_name"],
        unit=clean_data["unit"],
        stock_qty=clean_data["stock_qty"],
        cost_per_unit=clean_data["cost_per_unit"],
        min_stock_threshold=clean_data["min_stock_threshold"],
    )
    return jsonify({
        "success": True,
        "id": new_id,
        "message": f"Raw material '{clean_data['material_name']}' registered successfully."
    }), 201

@materials_bp.route("/materials/<int:material_id>", methods=["PUT"])
def update_material_endpoint(material_id: int):
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_material_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    try:
        updated = update_material(
            material_id=material_id,
            material_name=clean_data["material_name"],
            unit=clean_data["unit"],
            stock_qty=clean_data["stock_qty"],
            cost_per_unit=clean_data["cost_per_unit"],
            min_stock_threshold=clean_data["min_stock_threshold"],
        )
        if not updated:
            return jsonify({"error": f"Material #{material_id} not found."}), 404
        return jsonify({
            "success": True,
            "message": f"Raw material '{clean_data['material_name']}' updated successfully."
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@materials_bp.route("/materials/<int:material_id>", methods=["DELETE"])
def delete_material_endpoint(material_id: int):
    try:
        delete_material(material_id)
        return jsonify({"success": True, "message": "Raw material deleted successfully."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
