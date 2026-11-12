import sqlite3
from flask import Blueprint, request, jsonify
from services.production import (
    get_all_schedules,
    get_schedule_by_id,
    add_schedule,
    reserve_schedule,
    update_schedule,
    delete_schedule,
    complete_schedule,
    cancel_schedule,
    get_schedule_cost_breakdown,
    get_cost_trends,
    get_dashboard_summary,
    get_material_feasibility_report,
)
from utils.validators import validate_schedule_data, validate_date_range

production_bp = Blueprint("production", __name__)

# --- DASHBOARD ---
@production_bp.route("/dashboard", methods=["GET"])
def dashboard():
    product_id = request.args.get("product_id", type=int)
    material_id = request.args.get("material_id", type=int)
    start_date = request.args.get("start_date") or None
    end_date = request.args.get("end_date") or None

    valid, err_msg = validate_date_range(start_date, end_date)
    if not valid:
        return jsonify({"error": err_msg}), 400

    data = get_dashboard_summary(
        product_id=product_id,
        material_id=material_id,
        start_date=start_date,
        end_date=end_date,
    )
    return jsonify(data)

# --- SCHEDULE CRUD & RESERVATIONS ---
@production_bp.route("/schedule", methods=["GET"])
def list_schedules():
    records = get_all_schedules()
    return jsonify(records)

@production_bp.route("/schedule/<int:schedule_id>", methods=["GET"])
def get_schedule(schedule_id: int):
    record = get_schedule_by_id(schedule_id)
    if not record:
        return jsonify({"error": f"Schedule #{schedule_id} not found."}), 404
    return jsonify(record)

@production_bp.route("/schedule", methods=["POST"])
def create_schedule():
    data = request.get_json(silent=True) or request.form.to_dict()
    valid, err_msg, clean_data = validate_schedule_data(data)
    if not valid:
        return jsonify({"error": err_msg}), 400

    try:
        new_id = add_schedule(
            product_id=clean_data["product_id"],
            date_str=clean_data["date"],
            planned_qty=clean_data["planned_qty"],
            actual_qty=clean_data["actual_qty"],
        )
        created = get_schedule_by_id(new_id)
        status = created.get("status", "AT_RISK") if created else "AT_RISK"
        if status == "SCHEDULED":
            message = f"Production plan #{new_id} created. All required materials are reserved."
        else:
            shortage_lines = (created or {}).get("material_shortages", [])
            shortage_summary = "; ".join(
                f"{item['material_name']}: short {item['shortage_qty']:.2f} {item['unit']}"
                for item in shortage_lines
            )
            message = f"Production plan #{new_id} created as AT RISK. No materials were reserved."
            if shortage_summary:
                message += " Shortages: " + shortage_summary
            message += " Update Raw Materials after receipt, then select Reserve."
        return jsonify({"success": True, "id": new_id, "status": status, "message": message}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except sqlite3.IntegrityError:
        return jsonify({
            "error": f"Conflict: A schedule for this product on {clean_data['date']} already exists. The current database allows one schedule per product per date; use another date or remove the old pending/cancelled entry first."
        }), 409
    except Exception as e:
        return jsonify({"error": f"Failed to schedule production: {str(e)}"}), 500

@production_bp.route("/schedule/<int:schedule_id>/reserve", methods=["POST"])
def reserve_schedule_endpoint(schedule_id: int):
    """Manually reserve materials after inventory has been updated."""
    try:
        result = reserve_schedule(schedule_id)
        return jsonify(result), 200
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to reserve materials: {str(e)}"}), 500


@production_bp.route("/schedule/<int:schedule_id>/complete", methods=["POST"])
def complete_schedule_endpoint(schedule_id: int):
    """
    Marks a scheduled run as COMPLETED, converts reservations to consumption,
    deducts raw materials from inventory, and updates finished goods stock.
    Prevents double completion.
    """
    data = request.get_json(silent=True) or request.form.to_dict() or {}
    actual_qty = data.get("actual_qty")
    if actual_qty is not None:
        try:
            actual_qty = int(actual_qty)
            if actual_qty < 0:
                return jsonify({"error": "Actual production output cannot be negative."}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Actual quantity must be a valid integer."}), 400

    try:
        result = complete_schedule(schedule_id, actual_qty=actual_qty)
        return jsonify({
            "success": True,
            "message": f"Production run #{schedule_id} successfully completed. Raw materials consumed and finished goods updated.",
            "data": result,
        }), 200
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to complete production run: {str(e)}"}), 500

@production_bp.route("/schedule/<int:schedule_id>/cancel", methods=["POST"])
def cancel_schedule_endpoint(schedule_id: int):
    """
    Cancels a scheduled production run and releases reserved inventory.
    """
    try:
        result = cancel_schedule(schedule_id)
        return jsonify(result), 200
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to cancel run: {str(e)}"}), 500

@production_bp.route("/schedule/<int:schedule_id>/cost-breakdown", methods=["GET"])
def cost_breakdown_endpoint(schedule_id: int):
    """
    Returns frozen historical material costing breakdown for a production run.
    """
    try:
        breakdown = get_schedule_cost_breakdown(schedule_id)
        return jsonify(breakdown), 200
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve cost breakdown: {str(e)}"}), 500

@production_bp.route("/production/cost-trends", methods=["GET"])
def cost_trends_endpoint():
    """
    Returns historical unit cost trends across batches over time.
    """
    product_id = request.args.get("product_id", type=int)
    trends = get_cost_trends(product_id=product_id)
    return jsonify(trends), 200

@production_bp.route("/schedule/<int:schedule_id>", methods=["PUT"])
def update_schedule_endpoint(schedule_id: int):
    data = request.get_json(silent=True) or request.form.to_dict()
    date_str = str(data.get("date", "")).strip()
    try:
        planned_qty = int(data.get("planned_qty", 0))
        actual_qty = int(data.get("actual_qty", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Planned and Actual quantities must be valid integers."}), 400

    valid_date, date_error = validate_date_range(date_str, date_str)
    if not valid_date:
        return jsonify({"error": date_error}), 400
    if planned_qty <= 0 or actual_qty < 0:
        return jsonify({"error": "Planned quantity must be positive and actual quantity cannot be negative."}), 400

    try:
        updated = update_schedule(schedule_id, date_str, planned_qty, actual_qty)
        if not updated:
            return jsonify({"error": f"Schedule #{schedule_id} not found."}), 404
        return jsonify({"success": True, "message": "Production schedule updated successfully."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except sqlite3.IntegrityError:
        return jsonify({
            "error": f"Conflict: Another schedule for this product on {date_str} already exists. The current database allows one schedule per product per date."
        }), 409

@production_bp.route("/schedule/<int:schedule_id>", methods=["DELETE"])
def delete_schedule_endpoint(schedule_id: int):
    try:
        delete_schedule(schedule_id)
        return jsonify({"success": True, "message": "Production schedule entry removed and reservations released."})
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

# --- FEASIBILITY ---
@production_bp.route("/feasibility", methods=["GET"])
def feasibility():
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()

    if not start_date or not end_date:
        return jsonify({"error": "Both start_date and end_date are required (YYYY-MM-DD)."}), 400

    valid, err_msg = validate_date_range(start_date, end_date)
    if not valid:
        return jsonify({"error": err_msg}), 400

    report = get_material_feasibility_report(start_date, end_date)
    return jsonify({
        "start_date": start_date,
        "end_date": end_date,
        "report": report,
    })
