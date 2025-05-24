import pandas as pd

# Διαβάζεις το Excel
xls = pd.ExcelFile("Data.xlsx")
orders = pd.read_excel(xls, sheet_name='orders')
inventory = pd.read_excel(xls, sheet_name='inventory')

# Κανονικοποίηση SKU (ώστε να είναι όλοι string και να ταιριάζουν)
orders['SKU'] = orders['SKU'].astype(str)
inventory['SKU'] = inventory['SKU'].astype(str)

# Κρατάς τις μοναδικές τιμές SKU από το orders με τα πεδία που χρειάζεσαι
sku_info = orders[['SKU', 'Item title', 'Category', 'Brand']].drop_duplicates()

# Κάνεις merge τα δύο DataFrames με βάση το SKU
inventory_enriched = inventory.merge(sku_info, on='SKU', how='left')

# Αποθήκευση σε νέο φύλλο Excel
with pd.ExcelWriter("inventory_enriched.xlsx", engine='openpyxl') as writer:
    inventory_enriched.to_excel(writer, sheet_name='inventory_enriched', index=False)


