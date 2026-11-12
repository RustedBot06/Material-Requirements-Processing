from flask import Blueprint, request, jsonify
from services.production import (
    get_all_products,
    get_product_by_id,
    add_product,
    update_product,
    delete_product,
)
from utils.validators import validate_product_data

products_bp = Blueprint("products", __name__)

@products_bp.route("/products", methods=["GET"])
def list_products():
    products = get_all_products()
    return jsonify(products)

@products_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id: int):
    product = get_product_by_id(product_id)
    if not product:
        return jsonify({"error": f"Product #{product_id} not found."}), 404
    return jsonify(product)

@products_bp.route("/products", methods=["POST"])
def create_product():
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_product_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    new_id = add_product(
        name=clean_data["name"],
        packet_size=clean_data["packet_size"],
        stock_qty=clean_data["stock_qty"],
        mrp=clean_data["mrp"],
    )
    return jsonify({
        "success": True,
        "id": new_id,
        "message": f"Product '{clean_data['name']} - {clean_data['packet_size']}g' created successfully."
    }), 201

@products_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product_endpoint(product_id: int):
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_product_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    updated = update_product(
        product_id=product_id,
        name=clean_data["name"],
        packet_size=clean_data["packet_size"],
        stock_qty=clean_data["stock_qty"],
        mrp=clean_data["mrp"],
    )
    if not updated:
        return jsonify({"error": f"Product #{product_id} not found."}), 404

    return jsonify({
        "success": True,
        "message": f"Product '{clean_data['name']} - {clean_data['packet_size']}g' updated successfully."
    })

@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product_endpoint(product_id: int):
    try:
        delete_product(product_id)
        return jsonify({"success": True, "message": "Product deleted successfully."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
