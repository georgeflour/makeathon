import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, "inventory_enriched.xlsx")

def getInventory():
    # Διαβάζει το Excel
    df = pd.read_excel(EXCEL_PATH)

    # Μετονομασία στήλης
    df = df.rename(columns={'OriginalUnitPrice': 'price'})

    # Ομαδοποίηση ανά SKU και άθροιση ποσοτήτων
    if 'SKU' in df.columns and 'Quantity' in df.columns:
        df = df.groupby('SKU', as_index=False).agg({
            **{col: 'first' for col in df.columns if col not in ['SKU', 'Quantity']},
            'Quantity': 'sum'
        })

    # Προσθήκη στήλης index
    df.insert(0, 'index', range(1, len(df) + 1))

    # Μετατροπή σε JSON
    inventory_json = df.to_json(orient='records', lines=False)
    return inventory_json
