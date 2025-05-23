import pandas as pd

# Load the Excel file
excel_path = 'Data.xlsx'  # replace with your Excel file path
df = pd.read_excel(excel_path, engine='openpyxl')  # supports .xlsx files

# Convert to JSON
json_data = df.to_json(orient='records', indent=4)

# Save to a JSON file
with open('data.json', 'w') as f:
    f.write(json_data)

print("Excel data has been converted to JSON.")
