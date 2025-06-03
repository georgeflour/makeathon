import os, json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from flask import jsonify
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

EXCEL_DIR = "/app/excel"

ORDERS_PATH = os.path.join(EXCEL_DIR, "Data.xlsx")
INVENTORY_PATH = os.path.join(EXCEL_DIR, "inventory_enriched.xlsx")
BUNDLES_PATH = os.path.join(EXCEL_DIR, "bundles.json")

# Read the Excel files once when the module loads
try:
    logger.info(f"Attempting to read orders file from: {ORDERS_PATH}")
    orders_df = pd.read_excel(ORDERS_PATH)
    logger.info(f"Successfully read orders file. Shape: {orders_df.shape}")
    logger.debug(f"Orders columns: {orders_df.columns.tolist()}")
    
    logger.info(f"Attempting to read inventory file from: {INVENTORY_PATH}")
    inventory_df = pd.read_excel(INVENTORY_PATH)
    logger.info(f"Successfully read inventory file. Shape: {inventory_df.shape}")
    logger.debug(f"Inventory columns: {inventory_df.columns.tolist()}")
except Exception as e:
    logger.error(f"Error reading Excel files: {str(e)}")
    orders_df = pd.DataFrame()
    inventory_df = pd.DataFrame()

print(orders_df.head(2))
print(inventory_df.head(2))

def convert_to_native_types(value):
    if isinstance(value, (np.int64, np.int32, np.int16, np.int8)):
        return int(value)
    if isinstance(value, (np.float64, np.float32)):
        return float(value)
    return value

def get_avg_order_value():
    try:
        logger.info("Calculating average order value")
        
        # Convert CreatedDate to datetime if it's not already
        orders_df['CreatedDate'] = pd.to_datetime(orders_df['CreatedDate'])
        
        # Get the latest month in the data
        latest_date = orders_df['CreatedDate'].max()
        current_month = latest_date.replace(day=1)
        logger.debug(f"Latest date in data: {latest_date}")
        logger.debug(f"Current month for calculations: {current_month}")
        
        # Group by OrderNumber to get unique orders and their total amounts
        order_totals = orders_df.groupby('OrderNumber')['TotalOrderAmount'].sum()
        logger.debug(f"Total unique orders: {len(order_totals)}")
        logger.debug(f"Sample of order totals: {order_totals.head()}")
        
        # Calculate current month's average order value
        current_orders = orders_df[orders_df['CreatedDate'].dt.to_period('M') == pd.Period(current_month, freq='M')]
        logger.debug(f"Current month orders count: {len(current_orders)}")
        
        current_order_totals = current_orders.groupby('OrderNumber')['TotalOrderAmount'].sum()
        current_avg = convert_to_native_types(current_order_totals.mean() if not current_order_totals.empty else 0)
        logger.debug(f"Current month orders: {len(current_orders)}, Average: {current_avg}")
        
        # Calculate previous month's average order value
        prev_month = (current_month - pd.DateOffset(months=1))
        logger.debug(f"Previous month: {prev_month}")
        
        prev_orders = orders_df[orders_df['CreatedDate'].dt.to_period('M') == pd.Period(prev_month, freq='M')]
        logger.debug(f"Previous month orders count: {len(prev_orders)}")
        
        prev_order_totals = prev_orders.groupby('OrderNumber')['TotalOrderAmount'].sum()
        prev_avg = convert_to_native_types(prev_order_totals.mean() if not prev_order_totals.empty else current_avg)
        logger.debug(f"Previous month orders: {len(prev_orders)}, Average: {prev_avg}")
        
        # Calculate percentage change
        if prev_avg != 0:
            change = ((current_avg - prev_avg) / prev_avg) * 100
        else:
            change = 0
            
        result = {
            "current": round(float(current_avg), 2),
            "change": round(float(change), 1)
        }
        logger.info(f"Average order value calculation result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error calculating average order value: {str(e)}", exc_info=True)
        return {"current": 0, "change": 0}

def get_total_revenue():
    try:
        logger.info("Calculating total revenue")
        
        # Convert CreatedDate to datetime if it's not already
        orders_df['CreatedDate'] = pd.to_datetime(orders_df['CreatedDate'])
        
        # Get the latest month in the data
        latest_date = orders_df['CreatedDate'].max()
        current_month = latest_date.replace(day=1)
        logger.debug(f"Latest date in data: {latest_date}")
        logger.debug(f"Current month for calculations: {current_month}")
        
        # Calculate current month's total revenue
        current_orders = orders_df[orders_df['CreatedDate'].dt.to_period('M') == pd.Period(current_month, freq='M')]
        current_revenue = convert_to_native_types(current_orders['TotalOrderAmount'].sum() if not current_orders.empty else 0)
        logger.debug(f"Current month revenue: {current_revenue}")
        
        # Calculate previous month's total revenue
        prev_month = (current_month - pd.DateOffset(months=1))
        logger.debug(f"Previous month: {prev_month}")
        
        prev_orders = orders_df[orders_df['CreatedDate'].dt.to_period('M') == pd.Period(prev_month, freq='M')]
        prev_revenue = convert_to_native_types(prev_orders['TotalOrderAmount'].sum() if not prev_orders.empty else current_revenue)
        logger.debug(f"Previous month revenue: {prev_revenue}")
        
        # Calculate percentage change
        if prev_revenue != 0:
            change = ((current_revenue - prev_revenue) / prev_revenue) * 100
        else:
            change = 0
            
        result = {
            "current": round(float(current_revenue), 2),
            "change": round(float(change), 1)
        }
        logger.info(f"Total revenue calculation result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error calculating total revenue: {str(e)}", exc_info=True)
        return {"current": 0, "change": 0}

def get_active_bundles_count():
    try:
        logger.info("Getting active bundles count")
        return 0
    except Exception as e:
        logger.error(f"Error counting active bundles: {str(e)}")
        return 0

def get_stock_alerts_count():
    try:
        logger.info("Calculating stock alerts count")
        # Count items with quantity below threshold (e.g., 5)
        threshold = 5
        inventory_df_grouped = inventory_df.groupby('SKU')
        alerts_count = convert_to_native_types(
            inventory_df_grouped['Quantity'].apply(lambda x: len(x[x <= threshold])).sum()
        )
        logger.info(f"Found {alerts_count} stock alerts")
        return alerts_count
    except Exception as e:
        logger.error(f"Error counting stock alerts: {str(e)}")
        return 0

def get_revenue_trend():
    try:
        logger.info("Calculating revenue trend")
        # Convert CreatedDate to datetime if it's not already
        orders_df['CreatedDate'] = pd.to_datetime(orders_df['CreatedDate'])
        
        # Get the latest date in the data
        latest_date = orders_df['CreatedDate'].max()
        end_date = latest_date
        start_date = end_date - timedelta(days=7)
        logger.debug(f"Calculating trend from {start_date} to {end_date}")
        
        # Filter orders for the last 7 days
        mask = (orders_df['CreatedDate'] >= start_date) & (orders_df['CreatedDate'] <= end_date)
        recent_orders = orders_df[mask]
        logger.debug(f"Found {len(recent_orders)} orders in date range")
        
        # Group by date and calculate daily revenue
        daily_revenue = recent_orders.groupby(recent_orders['CreatedDate'].dt.date).agg({
            'TotalOrderAmount': 'sum',
            'OrderNumber': 'nunique',
            'Quantity': 'sum'
        }).reset_index()
        
        # Convert to list of dictionaries
        trend_data = []
        for _, row in daily_revenue.iterrows():
            trend_data.append({
                'date': row['CreatedDate'].strftime('%Y-%m-%d'),
                'revenue': convert_to_native_types(round(row['TotalOrderAmount'], 2)),
                'orders': convert_to_native_types(row['OrderNumber']),
                'items': convert_to_native_types(row['Quantity'])
            })
            
        # Fill in missing days with zero values
        all_dates = pd.date_range(start=start_date.date(), end=end_date.date(), freq='D')
        complete_trend = []
        
        for date in all_dates:
            date_str = date.strftime('%Y-%m-%d')
            existing_data = next((item for item in trend_data if item['date'] == date_str), None)
            
            if existing_data:
                complete_trend.append(existing_data)
            else:
                complete_trend.append({
                    'date': date_str,
                    'revenue': 0,
                    'orders': 0,
                    'items': 0
                })
        
        logger.info(f"Generated trend data for {len(complete_trend)} days")
        logger.debug(f"Trend data: {complete_trend}")
        return complete_trend
        
    except Exception as e:
        logger.error(f"Error getting revenue trend: {str(e)}", exc_info=True)
        return []

def get_dashboard_data():
    try:
        logger.info("Getting combined dashboard data")
        
        # Log the data ranges we're working with
        min_date = pd.to_datetime(orders_df['CreatedDate']).min()
        max_date = pd.to_datetime(orders_df['CreatedDate']).max()
        logger.info(f"Orders data range: {min_date} to {max_date}")
        
        # Get all calculations with detailed logging
        avg_order = get_avg_order_value()
        logger.debug(f"Average order value result: {avg_order}")
        
        total_rev = get_total_revenue()
        logger.debug(f"Total revenue result: {total_rev}")
        
        active_bundles = get_active_bundles_count()
        logger.debug(f"Active bundles count: {active_bundles}")
        
        stock_alerts = get_stock_alerts_count()
        logger.debug(f"Stock alerts count: {stock_alerts}")
        
        stats = {
            "avgOrderValue": avg_order["current"],
            "aovChange": avg_order["change"],
            "totalRevenue": total_rev["current"],
            "revenueChange": total_rev["change"],
            "activeBundles": active_bundles,
            "stockAlerts": stock_alerts
        }
        
        trend = get_revenue_trend()
        
        result = {
            "stats": stats,
            "revenueTrend": trend
        }
        logger.info("Successfully compiled dashboard data")
        logger.debug(f"Final dashboard data: {json.dumps(result, indent=2)}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}", exc_info=True)
        return jsonify({
            "stats": {
                "avgOrderValue": 0,
                "aovChange": 0,
                "totalRevenue": 0,
                "revenueChange": 0,
                "activeBundles": 0,
                "stockAlerts": 0
            },
            "revenueTrend": []
        })
