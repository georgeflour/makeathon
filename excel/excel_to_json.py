import pandas as pd
import json

def excel_to_json(input_excel_path, output_json_path):
    """
    Converts all sheets from a given Excel file into a single JSON file.
    Each sheet will be a key in the JSON, with its rows as a list of dicts.
    """
    # Read all sheets into a dict of DataFrames
    xls = pd.read_excel(input_excel_path, sheet_name=None)
    all_data = {}
    for sheet_name, df in xls.items():
        # Convert DataFrame to list of dicts (records)
        all_data[sheet_name] = df.to_dict(orient="records")
    # Write the dict to JSON
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

def excel_to_json_first_sheet(input_excel_path, output_json_path):
    """
    Converts only the first sheet of a given Excel file into a JSON file.
    """
    xls = pd.read_excel(input_excel_path, sheet_name=None)
    # Get the first sheet (by order)
    first_sheet_name = list(xls.keys())[0]
    df = xls[first_sheet_name]
    data = df.to_dict(orient="records")
    # Save as JSON (not as a dict with the sheet name, just the rows)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def transform_excel1():
    excel_to_json_first_sheet("Data.xlsx", "Orders.txt")


def transform_excel2():
    excel_to_json("inventory_enriched.xlsx", "inventory_enriched.txt")

def transform_excel3():
    excel_to_json("product_bundle_suggestions.xlsx", "product_bundle_suggestions.txt")

if __name__ == "__main__":
    transform_excel1()
    transform_excel2()
    transform_excel3()
    print("All excels transformed to JSON!")
