import os
import json
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, "..", "..", "..", "..", "excel", "Data.xlsx")

def get_price_trend():
    try:
        # Load the Excel file
        df = pd.read_excel(EXCEL_PATH)
        
        # Debug: Print column names
        print("Available columns:", df.columns.tolist())
        
        # Try to find the date column - common variations
        date_column = None
        possible_date_columns = ['CreatedDate', 'OrderDate', 'Order Date', 'Date', 'TransactionDate', 'Transaction Date', 'order_date']
        for col in possible_date_columns:
            if col in df.columns:
                date_column = col
                break
                
        if not date_column:
            raise ValueError(f"Could not find date column. Available columns: {df.columns.tolist()}")
            
        # Try to find the amount column
        amount_column = None
        possible_amount_columns = ['TotalOrderAmount', 'Total Order Amount', 'Amount', 'OrderAmount', 'Order Amount']
        for col in possible_amount_columns:
            if col in df.columns:
                amount_column = col
                break
                
        if not amount_column:
            raise ValueError(f"Could not find amount column. Available columns: {df.columns.tolist()}")
            
        # Try to find the order number column
        order_column = None
        possible_order_columns = ['OrderNumber', 'Order Number', 'OrderID', 'Order ID']
        for col in possible_order_columns:
            if col in df.columns:
                order_column = col
                break
                
        if not order_column:
            raise ValueError(f"Could not find order number column. Available columns: {df.columns.tolist()}")

        print(f"Using columns: Date='{date_column}', Amount='{amount_column}', Order='{order_column}'")
        
        # Ensure the order date column is parsed correctly
        df[date_column] = pd.to_datetime(df[date_column])
        
        # Group by OrderNumber to prevent duplicates
        grouped = df.groupby(order_column, as_index=False).agg({
            date_column: 'first',
            amount_column: 'sum'
        })
        
        # Sort by date to get the most recent orders
        grouped = grouped.sort_values(date_column, ascending=False)
        
        # Get the most recent date in the data
        most_recent_date = grouped[date_column].max()
        if pd.isnull(most_recent_date):
            return {"error": "No valid dates found in the data"}
            
        # Get the month and year from the most recent date
        most_recent_month = most_recent_date.month
        most_recent_year = most_recent_date.year
        
        # Calculate previous month and year
        if most_recent_month == 1:
            previous_month = 12
            previous_year = most_recent_year - 1
        else:
            previous_month = most_recent_month - 1
            previous_year = most_recent_year
            
        # Filter for most recent month and previous month
        recent_month_orders = grouped[
            (grouped[date_column].dt.month == most_recent_month) & 
            (grouped[date_column].dt.year == most_recent_year)
        ]
        
        previous_month_orders = grouped[
            (grouped[date_column].dt.month == previous_month) & 
            (grouped[date_column].dt.year == previous_year)
        ]
        
        # Sum total order amounts
        recent_month_total = recent_month_orders[amount_column].sum()
        previous_month_total = previous_month_orders[amount_column].sum()
        
        # Print debug information
        print(f"Most recent month ({most_recent_year}-{most_recent_month}): {recent_month_total}")
        print(f"Previous month ({previous_year}-{previous_month}): {previous_month_total}")
        print(f"Number of orders in recent month: {len(recent_month_orders)}")
        print(f"Number of orders in previous month: {len(previous_month_orders)}")
        
        # Calculate trend
        if previous_month_total == 0:
            return {
                "trend_percentage": None,
                "current_month_total": recent_month_total,
                "previous_month_total": previous_month_total,
                "current_month": f"{most_recent_year}-{most_recent_month}",
                "previous_month": f"{previous_year}-{previous_month}"
            }
        
        trend_percent = ((recent_month_total - previous_month_total) / previous_month_total) * 100
        
        return {
            "trend_percentage": round(trend_percent, 2),
            "current_month_total": round(recent_month_total, 2),
            "previous_month_total": round(previous_month_total, 2),
            "current_month": f"{most_recent_year}-{most_recent_month}",
            "previous_month": f"{previous_year}-{previous_month}"
        }
        
    except Exception as e:
        print(f"Error in get_price_trend: {str(e)}")
        print("Full error details:", e)
        return {"error": str(e)}