import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import json
import re
import uuid

def ai_call(

    product_to_clear: str = None,
    target_profit_margin_input = "Default (35%)", 
    duration_input = "Estimate based on seasonality and stock", 
    objective_input: str = "Increase average basket value by a target % (e.g., 10%)", 
    bundle_type_input: str = "All", 
    
    
    bundle_size_input: str = "Default (2–5 products)"
):
    """
    Calls Azure AI to create bundles

    Args:
        product_to_clear (str, optional): Specific product to clear. Defaults to None.
        target_profit_margin_input (any, optional) Defaults to "Default (35%)".
        duration_input (any, optional): Duration of Bundle. Defaults to "Estimate based on seasonality and stock".
        objective_input (str, optional):  Defaults to "Increase average basket value by a target % (e.g., 10%)".
        bundle_type_input (str, optional):
            Defaults to "All"
        bundle_size_input (str, optional): 
            Defaults to "Default (2–5 products)".
    """
    load_dotenv()


 

    prompt = f"""
    From the 6 first months of the data set you have been given,utilise those total sales number excluding ofcourse any duplicate order numbers and predict our revenue up to the end (time wise) of the data set. Answer using a prediction model. I expect you to give me an answer
    in the form of an absolute number without any dialogue, prologue or epilogue, just the number by itself, your **temperature should be 0**. 
    
    The answer is expected to be as follows :' {{ "predicted_revenue": number }}' nothing else nothing more, no wording just this json like structure
"""


    endpoint = os.environ.get("ENDPOINT")
    deployment = "makeathongpt41"  # Update if your deployment name is different!
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
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        extra_body={
            "data_sources": [
                {
                    "type": "azure_search",
                    "parameters": {
                        "endpoint": search_endpoint,
                        "index_name": search_index,
                        "authentication": {
                            "type": "api_key",
                            "key": search_key
                        }
                    }
                }
            ]
        },
        temperature=0.1, 
        max_tokens=3000 
        )
    response_content = completion.choices[0].message.content
    print(response_content)   
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

    result_json = {
        "predicted_revenue": predicted_revenue
    }

    print(json.dumps(result_json, indent=2))
    return result_json

def ai_call():
    # Your existing ai_call function code here
    pass