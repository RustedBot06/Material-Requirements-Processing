import sqlite3
from flask import Blueprint, request, jsonify
from services.production import (
    get_all_bom,
    get_bom_by_id,
    add_bom,
    update_bom,
    delete_bom,
)
from utils.validators import validate_bom_data

bom_bp = Blueprint("bom", __name__)

@bom_bp.route("/bom", methods=["GET"])
def list_bom():
    bom_list = get_all_bom()
    return jsonify(bom_list)

@bom_bp.route("/bom/<int:bom_id>", methods=["GET"])
def get_bom(bom_id: int):
    entry = get_bom_by_id(bom_id)
    if not entry:
        return jsonify({"error": f"BOM entry #{bom_id} not found."}), 404
    return jsonify(entry)

@bom_bp.route("/bom", methods=["POST"])
def create_bom():
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_bom_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    try:
        new_id = add_bom(
            product_id=clean_data["product_id"],
            material_id=clean_data["material_id"],
            qty_required=clean_data["qty_required"],
        )
        return jsonify({"success": True, "id": new_id, "message": "BOM recipe line added successfully."}), 201
    except sqlite3.IntegrityError:
        return jsonify({
            "error": "Conflict: A recipe line for this exact Product and Raw Material pair already exists."
        }), 409
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@bom_bp.route("/bom/<int:bom_id>", methods=["PUT"])
def update_bom_endpoint(bom_id: int):
    data = request.get_json(silent=True) or request.form.to_dict()
    try:
        qty_required = float(data.get("qty_required", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity required must be a valid number."}), 400

    if qty_required <= 0:
        return jsonify({"error": "Quantity required per packet must be strictly greater than zero."}), 400

    updated = update_bom(bom_id, qty_required)
    if not updated:
        return jsonify({"error": f"BOM entry #{bom_id} not found."}), 404

    return jsonify({"success": True, "message": "BOM recipe line updated successfully."})

@bom_bp.route("/bom/<int:bom_id>", methods=["DELETE"])
def delete_bom_endpoint(bom_id: int):
    try:
        delete_bom(bom_id)
        return jsonify({"success": True, "message": "BOM recipe line removed successfully."})
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
