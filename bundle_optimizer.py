import json
import pandas as pd
import numpy as np
# from sklearn.linear_model import LinearRegression
from sklearn.ensemble import HistGradientBoostingRegressor

# === 1. Φόρτωση JSON αρχείου ===

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

orders_raw = data["orders"]
inventory_raw = data["inventory"]
print("Hello")
print(inventory_raw)
# === 2. Δημιουργία DataFrames ===
df_orders = pd.DataFrame(orders_raw)
df_inventory = pd.DataFrame(inventory_raw)

# === 3. Ομαδοποίηση πωλήσεων ανά SKU ===
sales_summary = df_orders.groupby("SKU").agg({
    "FinalUnitPrice": "mean",
    "Quantity": "sum"
}).rename(columns={
    "FinalUnitPrice": "avg_price",
    "Quantity": "total_sales"
}).reset_index()

# === 4. Συνένωση με απόθεμα ===
bundle_df = pd.merge(sales_summary, df_inventory, on="SKU", how="left")
bundle_df.rename(columns={"Quantity": "stock"}, inplace=True)

# === 5. Προετοιμασία για μοντέλο ===
X = bundle_df[["avg_price", "stock"]].fillna(0).astype(int)
y = bundle_df["total_sales"].fillna(0).astype(int)
X = X.dropna()
y = y.loc[X.index].dropna()  # Match y to filtered X

model = HistGradientBoostingRegressor()
model.fit(X, y)

# === 6. Συνάρτηση πρότασης τιμής ===
def find_best_bundle_price(model, cost, stock, base_price):
    best_price = base_price
    best_revenue = 0

    # Test different prices
    for price in np.linspace(base_price * 0.8, base_price * 1.2, 10):
        price = 0 if pd.isna(price) else price
        stock = 0 if pd.isna(stock) else stock

        input_data = pd.DataFrame([[price, stock]], columns=["avg_price", "stock"])
        predicted_sales = model.predict(input_data)[0]

        revenue = min(predicted_sales, stock) * price
        if revenue > best_revenue:
            best_revenue = revenue
            best_price = price

    return best_price, best_revenue

# === 7. Εφαρμογή σε κάθε προϊόν ===
results = []

for _, row in bundle_df.iterrows():
    sku = row["SKU"]
    base_price = row["avg_price"]
    stock = row["stock"] or 0
    cost = base_price * 0.5  # Υποθετικό κόστος (50%)
    
    best_price, expected_revenue = find_best_bundle_price(model, cost, stock, base_price)
    input_df = pd.DataFrame([[base_price, stock]], columns=["avg_price", "stock"])
    predicted_sales = model.predict(input_df)[0]
    predicted_daily = predicted_sales / 14 if predicted_sales > 0 else 1
    duration_days = min((stock / predicted_daily), 30)

    results.append({
        "SKU": sku,
        "SuggestedBundlePrice": best_price,
        "ExpectedRevenue": expected_revenue,
        "BundleDurationDays": duration_days
    })

# === 8. Εμφάνιση αποτελεσμάτων ===
results_df = pd.DataFrame(results)
print(results_df)
