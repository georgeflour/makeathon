import pandas as pd
import itertools
from collections import Counter
import os

# --- Load and prepare order data ---
orders_df = pd.read_excel('Orders.xlsx')
orders_df['SKU'] = orders_df['SKU'].astype(str)

# Map SKU to latest price and name (from most recent order)
sku_to_price = orders_df.sort_values('CreatedDate').groupby('SKU')['FinalUnitPrice'].last().to_dict()
sku_to_title = orders_df.drop_duplicates('SKU').set_index('SKU')['Item title'].to_dict()

# --- Build bundle counters for different sizes ---
order_products = orders_df.groupby('OrderNumber')['SKU'].apply(set)
bundle_counters = {n: Counter() for n in range(2, 6)}  # For 2-5 item bundles

for products in order_products:
    products = sorted(products)
    for n in range(2, 6):
        for combo in itertools.combinations(products, n):
            bundle_counters[n][combo] += 1

# --- Construct DataFrames per bundle size ---
sheets = {}
max_rows_per_sheet = 10000  # Safety limit (optional, adjust as needed)
discount_range = range(25, 35)  # 25% up to 34%

for n in range(2, 6):
    results = []
    for bundle, count in bundle_counters[n].items():
        if count >= 5:  # Only bundles bought together at least 5 times!
            names = [sku_to_title.get(sku, "") for sku in bundle]
            prices = [sku_to_price.get(sku, 0) for sku in bundle]
            orig_sum = sum(prices)
            if orig_sum > 0 and all(price > 0 for price in prices):
                bundle_data = {
                    'SKUs': ', '.join(bundle),
                    'Products': ', '.join(names),
                    'Count': count,
                    'Bundle Size': n,
                    'Original Total Price': orig_sum
                }
                # Add suggested prices for each margin/discount
                for discount in discount_range:
                    bundle_data[f'Suggested Price ({discount}% off)'] = round(orig_sum * (1 - discount / 100), 2)
                results.append(bundle_data)
    df = pd.DataFrame(results).sort_values('Count', ascending=False).reset_index(drop=True)
    df = df.head(max_rows_per_sheet)
    sheets[f'Bundles_{n}'] = df

# --- Write each bundle size to a different sheet ---
outfile = 'product_bundle_suggestions.xlsx'
with pd.ExcelWriter(outfile, engine='openpyxl') as writer:
    for sheetname, df in sheets.items():
        df.to_excel(writer, sheet_name=sheetname, index=False)

print(f"Excel file saved: {os.path.abspath(outfile)} with sheets: {', '.join(sheets.keys())}")

