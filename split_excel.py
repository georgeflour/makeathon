import pandas as pd

# Read only the 'orders' sheet from Data.xlsx
df = pd.read_excel("excel/Data.xlsx", sheet_name="orders")

# Save the dataframe to Orders.xlsx
df.to_excel("excel/Orders.xlsx", index=False)
