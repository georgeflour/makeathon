import os
import json
import pandas as pd

EXCEL_PATH = "excel/Data.xlsx"

def get_totalsales():
    """
    This function is used to get a prediction from the AI model.
    It returns a JSON response with the prediction.
    It reads the chosen bundles from a JSON file and requests a prediction
    """

    # Read the Excel file
    df = pd.read_excel(EXCEL_PATH)

    grouped = df.groupby('OrderNumber', as_index=False)['TotalOrderAmount'].first()
    # Sum the values in the 'TotalOrderAmount' column
    total_sum = grouped['TotalOrderAmount'].sum()
    
    print (total_sum)
    
    return total_sum
