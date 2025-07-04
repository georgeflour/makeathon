import pandas as pd
import json

# Διαβάζεις όλα τα φύλλα
excel_path = r"excel/inventory_enriched.xlsx"
sheets_dict = pd.read_excel(excel_path, sheet_name=None, engine="openpyxl")

# Δημιουργείς ένα λεξικό για όλα τα φύλλα με μορφή JSON
all_data_json = {
    sheet_name: df.fillna(0).to_dict(orient="records") for sheet_name, df in sheets_dict.items()
}

# Αποθήκευση σε αρχείο JSON
with open("inventory.json", "w", encoding="utf-8") as f:
    json.dump(all_data_json, f, ensure_ascii=False, indent=4)

print("excel to json")
