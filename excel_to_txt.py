import pandas as pd
import gzip

# Convert Data.xlsx to Data.txt
data_df = pd.read_excel("excel/Data.xlsx")
data_df.to_csv("Data.txt", sep=",", index=False)

# Convert Orders.xlsx to Orders.txt
orders_df = pd.read_excel("excel/Orders.xlsx")
orders_df.to_csv("Orders.txt", sep=",", index=False)

# Convert inventory_enriched.xlsx to inventory_enriched.txt
inventory_df = pd.read_excel("excel/inventory_enriched.xlsx")
inventory_df.to_csv("Inventory.txt", sep=",", index=False)

with open("Orders.txt", "rb") as f_in, gzip.open("Orders-Compressed.txt", "wb") as f_out:
    f_out.writelines(f_in)
