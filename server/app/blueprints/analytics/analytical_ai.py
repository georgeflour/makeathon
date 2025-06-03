import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import json
import re
import uuid

def ai_call(
    total_sales: float,
    product_to_clear: str = None,
    target_profit_margin_input = "Default (35%)", 
    duration_input = "Estimate based on seasonality and stock", 
    objective_input: str = "Increase average basket value by a target % (e.g., 10%)", 
    bundle_type_input: str = "All", 
    bundle_size_input: str = "Default (2-5 products)"
):
    """
    Calls Azure AI to predict revenue
    Args:
        total_sales (float): Total sales from first 6 months
        product_to_clear (str, optional): Specific product to clear. Defaults to None.
        target_profit_margin_input (any, optional) Defaults to "Default (35%)".
        duration_input (any, optional): Duration of Bundle. Defaults to "Estimate based on seasonality and stock".
        objective_input (str, optional):  Defaults to "Increase average basket value by a target % (e.g., 10%)".
        bundle_type_input (str, optional):
            Defaults to "All"
        bundle_size_input (str, optional): 
            Defaults to "Default (2-5 products)".
    """
    load_dotenv()

    prompt = f"""
        You have access to sales data with the following structure:
        - OrderNumber: unique order identifier  
        - CreatedDate: order date
        - TotalOrderAmount: total amount per order
        - Current total sales from first 6 months: {total_sales}

        Based on this data, predict revenue for the full dataset period.
        Return ONLY: {{"predicted_revenue": number}}
    """

    endpoint = os.environ.get("ENDPOINT")
    deployment = "gpt-4.1"
    search_endpoint = os.environ.get("SEARCH_ENDPOINT")
    search_index = os.environ.get("SEARCH_INDEX_NAME")
    search_key = os.environ.get("SEARCH_KEY")

    client = AzureOpenAI(
        api_key=os.environ.get("AZURE_KEY"),
        azure_endpoint=endpoint,
        api_version="2024-05-01-preview",
    )

    completion = client.chat.completions.create(
        model=deployment,
        messages=[{"role": "user", "content": prompt}],
        extra_body={
            "data_sources": [
                {
                    "type": "azure_search",
                    "parameters": {
                        "endpoint": search_endpoint,
                        "index_name": search_index,
                        "authentication": {"type": "api_key", "key": search_key},
                    },
                }
            ]
        },
        temperature=0.0, 
        max_tokens=3000, 
        )
    response_content = completion.choices[0].message.content
    
    print(f"AI Response: {response_content}")
    
    # Extract numeric value
    match = re.search(r'[\d,]+(?:\.\d+)?', response_content)
    if match:
        number_str = match.group(0).replace(',', '')
        try:
            predicted_revenue = float(number_str)
        except ValueError:
            predicted_revenue = None
    else:
        predicted_revenue = None

    try:
        result = json.loads(response_content)
        predicted_revenue = result.get('predicted_revenue')
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Response was: {response_content}")

    if predicted_revenue is None:
        print("No predicted revenue from Azure AI, calculating locally")
        predicted_revenue = calculate_locally(total_sales)
        
    result_json = {
        "predicted_revenue": predicted_revenue
    }

    print(json.dumps(result_json, indent=2))
    return result_json

def calculate_locally(total_sales, months_data=6, total_months=12):
    # Calculate the average monthly sales
    """
    Simple prediction based on existing sales data
    """
    # Linear extrapolation
    monthly_average = total_sales / months_data
    predicted_revenue = monthly_average * total_months

    return round(predicted_revenue, 2)