import os
import json
import pandas as pd
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, "Data.xlsx")

def get_price_trend():
    # Load the Excel file
    df = pd.read_excel(EXCEL_PATH)

    # Ensure the order date column is parsed correctly
    df['OrderDate'] = pd.to_datetime(df['OrderDate'])

    # Group by OrderNumber to prevent duplicates
    grouped = df.groupby('OrderNumber', as_index=False).first()

    # Extract year and month
    grouped['Year'] = grouped['OrderDate'].dt.year
    grouped['Month'] = grouped['OrderDate'].dt.month

    # Get current and previous month
    today = datetime.today()
    this_month = today.month
    this_year = today.year

    # Adjust for edge case: January
    if this_month == 1:
        last_month = 12
        last_year = this_year - 1
    else:
        last_month = this_month - 1
        last_year = this_year

    # Filter for this and last month
    this_month_orders = grouped[
        (grouped['Month'] == this_month) & (grouped['Year'] == this_year)
    ]
    last_month_orders = grouped[
        (grouped['Month'] == last_month) & (grouped['Year'] == last_year)
    ]

    # Sum total order amounts
    this_month_total = this_month_orders['TotalOrderAmount'].sum()
    last_month_total = last_month_orders['TotalOrderAmount'].sum()

    # Calculate trend
    if last_month_total == 0:
        trend_percent = None
    else:
        trend_percent = ((this_month_total - last_month_total) / last_month_total) * 100

    return {
        "trend_percentage": round(trend_percent, 2) if trend_percent is not None else None
    }