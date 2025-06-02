import pandas as pd

# Load Orders and Pair Count files
orders = pd.read_excel('excel/Orders.xlsx')
pairs = pd.read_excel('excel/product_pair_counts.xlsx')

# Ensure SKUs are strings
pairs['SKU_1'] = pairs['SKU_1'].astype(str)
pairs['SKU_2'] = pairs['SKU_2'].astype(str)
orders['SKU'] = orders['SKU'].astype(str)

# Map SKU to latest price and product name from Orders.xlsx
sku_to_price = orders.sort_values('CreatedDate').groupby('SKU')['FinalUnitPrice'].last().to_dict()
sku_to_title = orders.drop_duplicates('SKU').set_index('SKU')['Item title'].to_dict()

# Prepare strong pairs
strong_pairs = pairs[pairs['Count'] > 1].sort_values('Count', ascending=False)
strong_pairs['Product 1'] = strong_pairs['SKU_1'].map(sku_to_title)
strong_pairs['Product 2'] = strong_pairs['SKU_2'].map(sku_to_title)

def bundle_price_and_discount(sku1, sku2, max_discount=0.35):
    price1 = sku_to_price.get(sku1, 0)
    price2 = sku_to_price.get(sku2, 0)
    orig_sum = price1 + price2
    if orig_sum == 0:
        return orig_sum, 0, "0%"
    suggested_price = round(orig_sum * (1 - max_discount), 2)
    discount_percent = round((1 - (suggested_price / orig_sum)) * 100, 1) if orig_sum else 0
    return orig_sum, suggested_price, f"{discount_percent}%"

# Calculate bundle suggestions
results = []
for idx, row in strong_pairs.iterrows():
    orig_sum, suggested_price, discount = bundle_price_and_discount(row['SKU_1'], row['SKU_2'])
    # Only keep pairs where both prices are known
    if orig_sum > 0:
        results.append({
            'SKU_1': row['SKU_1'],
            'Product 1': row['Product 1'],
            'SKU_2': row['SKU_2'],
            'Product 2': row['Product 2'],
            'Count': row['Count'],
            'Original Total Price': orig_sum,
            'Suggested Bundle Price': suggested_price,
            'Discount from Original': discount
        })

suggestions = pd.DataFrame(results)

# Save both original pairs and suggestions to the same Excel file as two sheets
with pd.ExcelWriter('excel/product_pair_counts.xlsx', engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
    pairs.to_excel(writer, sheet_name='PairCounts', index=False)
    suggestions.to_excel(writer, sheet_name='BundleSuggestions', index=False)

print("BundleSuggestions sheet (using Orders.xlsx for prices) added to product_pair_counts.xlsx")
