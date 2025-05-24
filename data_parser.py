import pandas as pd
import json

# Διαβάζεις όλα τα φύλλα
excel_path = 'Data.xlsx'
sheets_dict = pd.read_excel(excel_path, sheet_name='orders', engine='openpyxl')

# Δημιουργείς ένα λεξικό για όλα τα φύλλα με μορφή JSON
all_data_json = {
    sheet_name: df.to_dict(orient='records')
    for sheet_name, df in sheets_dict.items()
}

# Αποθήκευση σε αρχείο JSON
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(all_data_json, f, ensure_ascii=False, indent=4)

print("Όλα τα φύλλα του Excel μετατράπηκαν σε JSON.")
