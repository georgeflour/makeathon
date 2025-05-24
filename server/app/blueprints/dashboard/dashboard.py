import os, json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ORDERS_PATH = os.path.join(BASE_DIR, "Data.xlsx")
INVENTORY_PATH = os.path.join(BASE_DIR, "..", "inventory", "inventory_enriched.xlsx")
BUNDLES_PATH = os.path.join(BASE_DIR, "..", "bundles", "bundles.json")
# Read the Excel files once when the module loads
try:
    orders_df = pd.read_excel(ORDERS_PATH)
    inventory_df = pd.read_excel(INVENTORY_PATH)
except Exception as e:
    print(f"Error reading Excel files: {str(e)}")
    orders_df = pd.DataFrame()
    inventory_df = pd.DataFrame()

def convert_to_native_types(value):
    if isinstance(value, (np.int64, np.int32, np.int16, np.int8)):
        return int(value)
    if isinstance(value, (np.float64, np.float32)):
        return float(value)
    return value

def get_avg_order_value():
    try:
        # Group by OrderNumber to get unique orders and their total amounts
        order_totals = orders_df.groupby('OrderNumber')['TotalOrderAmount'].sum()
        
        # Calculate current month's average order value
        current_month = datetime.now().replace(day=1)
        current_orders = orders_df[pd.to_datetime(orders_df['CreatedDate']).dt.to_period('M') == pd.Period(current_month, freq='M')]
        current_order_totals = current_orders.groupby('OrderNumber')['TotalOrderAmount'].sum()
        current_avg = convert_to_native_types(current_order_totals.mean() if not current_order_totals.empty else 0)
        
        # Calculate previous month's average order value
        prev_month = (current_month - timedelta(days=1)).replace(day=1)
        prev_orders = orders_df[pd.to_datetime(orders_df['CreatedDate']).dt.to_period('M') == pd.Period(prev_month, freq='M')]
        prev_order_totals = prev_orders.groupby('OrderNumber')['TotalOrderAmount'].sum()
        prev_avg = convert_to_native_types(prev_order_totals.mean() if not prev_order_totals.empty else current_avg)
        
        # Calculate percentage change
        if prev_avg != 0:
            change = ((current_avg - prev_avg) / prev_avg) * 100
        else:
            change = 0
            
        return {
            "current": round(float(current_avg), 2),
            "change": round(float(change), 1)
        }
    except Exception as e:
        print(f"Error calculating average order value: {str(e)}")
        return {"current": 0, "change": 0}

def get_total_revenue():
    try:
        # Calculate current month's total revenue
        current_month = datetime.now().replace(day=1)
        current_orders = orders_df[pd.to_datetime(orders_df['CreatedDate']).dt.to_period('M') == pd.Period(current_month, freq='M')]
        current_revenue = convert_to_native_types(current_orders['TotalOrderAmount'].sum() if not current_orders.empty else 0)
        
        # Calculate previous month's total revenue
        prev_month = (current_month - timedelta(days=1)).replace(day=1)
        prev_orders = orders_df[pd.to_datetime(orders_df['CreatedDate']).dt.to_period('M') == pd.Period(prev_month, freq='M')]
        prev_revenue = convert_to_native_types(prev_orders['TotalOrderAmount'].sum() if not prev_orders.empty else current_revenue)
        
        # Calculate percentage change
        if prev_revenue != 0:
            change = ((current_revenue - prev_revenue) / prev_revenue) * 100
        else:
            change = 0
            
        return {
            "current": round(float(current_revenue), 2),
            "change": round(float(change), 1)
        }
    except Exception as e:
        print(f"Error calculating total revenue: {str(e)}")
        return {"current": 0, "change": 0}

def get_active_bundles_count():
    try:
        return 0
    except Exception as e:
        print(f"Error counting active bundles: {str(e)}")
        return 0

def get_stock_alerts_count():
    try:
        # Count items with quantity below threshold (e.g., 5)
        threshold = 5
        inventory_df_grouped = inventory_df.groupby('SKU')
        alerts_count = convert_to_native_types(
            inventory_df_grouped['Quantity'].apply(lambda x: len(x[x <= threshold])).sum()
        )
        
        return alerts_count
    except Exception as e:
        print(f"Error counting stock alerts: {str(e)}")
        return 0
