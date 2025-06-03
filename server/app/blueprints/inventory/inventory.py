import pandas as pd
import os

EXCEL_PATH = "excel/inventory_enriched.xlsx"


def getInventory(dropdown=False):
    # Διαβάζει το Excel
    df = pd.read_excel(EXCEL_PATH)

    # Μετονομασία στήλης
    df = df.rename(columns={"OriginalUnitPrice": "price"})

    # Ομαδοποίηση ανά SKU και άθροιση ποσοτήτων
    if "SKU" in df.columns and "Quantity" in df.columns:
        df = df.groupby("SKU", as_index=False).agg(
            {
                **{col: "first" for col in df.columns if col not in ["SKU", "Quantity"]},
                "Quantity": "sum",
            }
        )

    # Προσθήκη στήλης index
    df.insert(0, "index", range(1, len(df) + 1))
    if dropdown:
        # Μετονομασία της στήλης 'Item Title' σε 'title'
        df = df.rename(columns={"Item title": "title"})

        # Επιλογή μόνο των επιθυμητών στηλών
        df = df[["index", "title", "Quantity", "price", "Category"]]

        # Μετονομασία της στήλης 'Quantity' σε 'quantity' για ομοιομορφία
        df = df.rename(columns={"Quantity": "quantity"})
        # Μετονομασία της στήλης 'Category' σε 'category'
        df = df.rename(columns={"Category": "category"})

    # Μετατροπή σε JSON
    inventory_json = df.to_json(orient="records", lines=False)
    return inventory_json
