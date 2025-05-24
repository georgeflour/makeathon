import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import HistGradientBoostingRegressor
import joblib
from datetime import datetime, timedelta
import os
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
from db import get_db_connection
from redis_config import (
    get_redis_connection,
    cache_inventory_data,
    get_cached_inventory,
    cache_price_optimization,
    cache_bundle_performance
)
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === 1. Load Data from SQLite ===
def load_data():
    conn = get_db_connection()
    
    # Load orders data
    orders_query = """
    SELECT * FROM Orders
    """
    df_orders = pd.read_sql_query(orders_query, conn)
    
    # Load inventory data
    inventory_query = """
    SELECT * FROM Inventory
    """
    df_inventory = pd.read_sql_query(inventory_query, conn)
    
    # Cache inventory data in Redis
    inventory_data = df_inventory.to_dict('records')
    cache_inventory_data(inventory_data)
    
    conn.close()
    return df_orders, df_inventory

# === 2. Process Data ===
df_orders, df_inventory = load_data()

# === 3. Group sales by SKU ===
sales_summary = df_orders.groupby("SKU").agg({
    "FinalUnitPrice": "mean",
    "Quantity": "sum"
}).rename(columns={
    "FinalUnitPrice": "avg_price",
    "Quantity": "total_sales"
}).reset_index()

# === 4. Merge with inventory ===
bundle_df = pd.merge(sales_summary, df_inventory, on="SKU", how="left")
bundle_df.rename(columns={"Quantity": "stock"}, inplace=True)


# Replace NaN values in stock or avg_price (if any)
bundle_df["stock"] = bundle_df["stock"].fillna(0)
bundle_df["avg_price"] = bundle_df["avg_price"].fillna(0)
bundle_df["total_sales"] = bundle_df["total_sales"].fillna(0)

# === 5. Prepare for model ===
X = bundle_df[["avg_price", "stock"]].fillna(0).astype(int)
y = bundle_df["total_sales"].fillna(0).astype(int)
X = X.dropna()
y = y.loc[X.index].dropna()  # Match y to filtered X
timestamp_path = "last_trained.txt"
model_path = "pricing_model.pkl"

def get_last_trained():
    if not os.path.exists(timestamp_path):
        return None
    with open(timestamp_path, "r") as f:
        return datetime.fromisoformat(f.read().strip())

def update_last_trained():
    with open(timestamp_path, "w") as f:
        f.write(datetime.now().isoformat())

def model_outdated():
    last = get_last_trained()
    if not last:
        return True
    return datetime.now() - last > timedelta(hours=12)

if model_outdated():
    print("Training model...")
    # === Train your model here ===
    model = LinearRegression()
    model.fit(X, y)
    joblib.dump(model, model_path)
    update_last_trained()
elif os.path.exists(model_path):
    model = joblib.load(model_path)
    print("✅ Loaded pretrained model.")
else:
    # Train model as before
    model = LinearRegression()
    model.fit(X, y)
    joblib.dump(model, model_path)
    print("✅ Trained and saved new model.")

# === 6. Price suggestion function ===
def find_best_bundle_price(model, cost, stock, base_price, bundle_id=None):
    # Check Redis cache first
    if bundle_id:
        redis_client = get_redis_connection()
        cached_result = redis_client.get(f"price:optimization:{bundle_id}")
        if cached_result:
            logger.info(f"Using cached price optimization for bundle {bundle_id}")
            return json.loads(cached_result)

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

    result = {
        "best_price": best_price,
        "best_revenue": best_revenue
    }

    # Cache the result if bundle_id is provided
    if bundle_id:
        cache_price_optimization(bundle_id, result)

    return best_price, best_revenue

# === 7. Apply to each product ===
results = []

for _, row in bundle_df.iterrows():
    sku = row["SKU"]
    base_price = row["avg_price"]
    stock = row["stock"] or 0
    cost = base_price * 0.5  # Hypothetical cost (50%)
    
    # Generate a unique bundle ID
    bundle_id = f"bundle_{sku}_{int(pd.Timestamp.now().timestamp())}"
    
    best_price, expected_revenue = find_best_bundle_price(model, cost, stock, base_price, bundle_id)
    input_df = pd.DataFrame([[base_price, stock]], columns=["avg_price", "stock"])
    predicted_sales = model.predict(input_df)[0]
    predicted_daily = predicted_sales / 14 if predicted_sales > 0 else 1
    duration_days = min((stock / predicted_daily), 30)

    bundle_result = {
        "SKU": sku,
        "BundleID": bundle_id,
        "SuggestedBundlePrice": best_price,
        "ExpectedRevenue": expected_revenue,
        "BundleDurationDays": duration_days
    }

    # Cache bundle performance metrics
    performance_data = {
        "predicted_sales": predicted_sales,
        "predicted_daily": predicted_daily,
        "duration_days": duration_days,
        "expected_revenue": expected_revenue
    }
    cache_bundle_performance(bundle_id, performance_data)

    results.append(bundle_result)

# === 8. Save results to SQLite ===
def save_results(results):
    conn = get_db_connection()
    results_df = pd.DataFrame(results)
    results_df.to_sql('BundleSuggestions', conn, if_exists='replace', index=False)
    conn.close()
    logger.info("Bundle suggestions saved to database!")

save_results(results)
