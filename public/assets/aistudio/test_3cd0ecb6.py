import mrp

material_id = 1  # Change this to an existing raw material ID

data = mrp.get_material_performance(material_id)

if data is None:
    print("Material not found.")

else:
    print("\nMATERIAL DETAILS")
    print("----------------")
    print("Name:", data["material_name"])
    print("Available stock:", data["stock_qty"], data["unit"])

    print("\nDAILY REQUIREMENTS")
    print("-----------------")

    for record in data["daily_requirements"]:
        print(
            record["date"],
            "->",
            record["gross_requirement"],
            data["unit"]
        )