from flask import Flask, render_template, request, redirect, url_for
from database import *
import sqlite3
from datetime import date as Date
import mrp

app = Flask(__name__)

db_ini()

@app.route("/")
def home():
    return redirect(url_for("materials"))


@app.route("/materials", methods=["GET", "POST"])
def materials():

    if request.method == "POST":

        name = request.form["material_name"].strip()
        unit = request.form["unit"]

        try:
            stock = float(request.form["stock_qty"])
            price = float(request.form["cost_per_unit"])

            if not name or stock < 0 or price < 0:
                return "Invalid input. Check the values and try again."

        except ValueError:
            return "Please enter valid numerical values."

        add_rm(name, unit, stock, price)

        return redirect(url_for("materials"))

    materials = getall_rm()

    return render_template("materials.html", materials=materials)

@app.route("/materials/update/<int:material_id>", methods=["POST"])
def update_material(material_id):

    material = get_row_rm(material_id)

    if material is None:
        return "Material not found.", 404

    name = request.form["material_name"].strip()
    unit = request.form["unit"]

    try:
        stock = float(request.form["stock_qty"])
        cost = float(request.form["cost_per_unit"])

        if not name or stock < 0 or cost < 0:
            return "Invalid input."

    except ValueError:
        return "Please enter valid numerical values."

    update_rm(material_id, name, unit, stock, cost)

    return redirect(url_for("materials"))

@app.route("/materials/delete/<int:material_id>", methods=["POST"])
def delete_material(material_id):

    deleted = delete_row_rm(material_id)

    if deleted == 0:
        return "Material not found.", 404

    return redirect(url_for("materials"))

@app.route("/products", methods=["GET", "POST"])
def products():

    if request.method == "POST":

        name = request.form["name"].strip()

        try:
            packet_size = int(request.form["packet_size"])
            stock = int(request.form["stock_qty"])
            mrp = float(request.form["mrp"])

            if not name or packet_size <= 0 or stock < 0 or mrp < 0:
                return "Invalid input."

        except ValueError:
            return "Please enter valid numerical values."

        add_prod(name, packet_size, stock, mrp)

        return redirect(url_for("products"))

    products = getall_prods()

    return render_template("products.html", products=products)

@app.route("/products/update/<int:product_id>", methods=["POST"])
def update_product_route(product_id):

    product = get_row_prods(product_id)

    if product is None:
        return "Product not found.", 404

    name = request.form["name"].strip()

    try:
        packet_size = int(request.form["packet_size"])
        stock = int(request.form["stock_qty"])
        mrp = float(request.form["mrp"])

        if not name or packet_size <= 0 or stock < 0 or mrp < 0:
            return "Invalid input."

    except ValueError:
        return "Please enter valid numerical values."

    update_prods(product_id, name, packet_size, stock, mrp)

    return redirect(url_for("products"))

@app.route("/products/delete/<int:product_id>", methods=["POST"])
def delete_product_route(product_id):

    deleted = delete_row_prods(product_id)

    if deleted == 0:
        return "Product not found.", 404

    return redirect(url_for("products"))

#----bom----
@app.route("/bom", methods=["GET", "POST"])
def bom():

    if request.method == "POST":

        try:
            product_id = int(request.form["product_id"])
            material_id = int(request.form["material_id"])
            qty = float(request.form["qty_required"])

            if qty <= 0:
                return "Invalid quantity."

        except ValueError:
            return "Please enter valid numerical values."

        try:
            add_bom(product_id, material_id, qty)

        except sqlite3.IntegrityError:
            return "Invalid product/material or this BOM entry already exists."

        except ValueError as e:
            return str(e), 400

        return redirect(url_for("bom"))

    bom_entries = getall_bom()
    products = getall_prods()
    materials = getall_rm()

    return render_template(
        "bom.html",
        bom_entries=bom_entries,
        products=products,
        materials=materials
    )

@app.route("/bom/update/<int:bom_id>", methods=["POST"])
def update_bom_route(bom_id):

    bom_entry = get_row_bom(bom_id)

    if bom_entry is None:
        return "BOM entry not found.", 404

    try:
        qty = float(request.form["qty_required"])

        if qty <= 0:
            return "Invalid quantity."

    except ValueError:
        return "Please enter valid numerical values."

    update_bom(bom_id, qty)

    return redirect(url_for("bom"))

@app.route("/bom/delete/<int:bom_id>", methods=["POST"])
def delete_bom_route(bom_id):

    deleted = delete_row_bom(bom_id)

    if deleted == 0:
        return "BOM entry not found.", 404

    return redirect(url_for("bom"))

@app.route("/schedule", methods=["GET", "POST"])
def schedule():

    if request.method == "POST":
        try:
            product_id = int(request.form["product_id"])

            production_date = Date.fromisoformat(request.form["date"])

            planned_qty = int(request.form["planned_qty"])
            actual_qty = int(request.form["actual_qty"])

            if planned_qty < 0 or actual_qty < 0:
                return "Production quantities cannot be negative."

        except ValueError:
            return "Please enter valid values."

        add_production(
            product_id,
            production_date.isoformat(),
            planned_qty,
            actual_qty
        )

        return redirect(url_for("schedule"))
    
    products = getall_prods()
    records = getall_production()
    today = Date.today().isoformat()

    return render_template(
        "schedule.html",
        products=products,
        records=records,
        today=today
    )

@app.route("/schedule/update/<int:schedule_id>", methods=["POST"])
def update_schedule(schedule_id):

    record = get_row_production(schedule_id)

    if record is None:
        return "Production record not found.", 404

    try:
        production_date = Date.fromisoformat(request.form["date"])
        planned_qty = int(request.form["planned_qty"])
        actual_qty = int(request.form["actual_qty"])

        if planned_qty < 0 or actual_qty < 0:
            return "Production quantities cannot be negative."

    except ValueError:
        return "Please enter valid values."

    update_production(
        schedule_id,
        production_date.isoformat(),
        planned_qty,
        actual_qty
    )

    return redirect(url_for("schedule"))

@app.route("/schedule/delete/<int:schedule_id>", methods=["POST"])
def delete_schedule(schedule_id):

    deleted = delete_row_production(schedule_id)

    if deleted == 0:
        return "Production record not found.", 404

    return redirect(url_for("schedule"))


@app.route("/feasibility")
def feasibility():

    start_date = request.args.get("start_date", "")
    end_date = request.args.get("end_date", "")

    report = None
    error = None

    if start_date or end_date:

        if not start_date or not end_date:
            error = "Please select both start and end dates."

        else:
            try:
                start = Date.fromisoformat(start_date)
                end = Date.fromisoformat(end_date)

                if start > end:
                    error = "Start date cannot be after end date."

                else:
                    report = mrp.get_material_feasibility(
                        start_date,
                        end_date
                    )

            except ValueError:
                error = "Invalid date format."

    return render_template(
        "feasibility.html",
        report=report,
        start_date=start_date,
        end_date=end_date,
        error=error
    )


if __name__ == "__main__":
    app.run(debug=True)