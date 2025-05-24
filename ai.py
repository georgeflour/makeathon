import os
import requests
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("AZURE_KEY")
endpoint = os.getenv("ENDPOINT")  # Should look like https://YOUR-RESOURCE-NAME.openai.azure.com/
deployment = "makeathongpt41"

url = f"{endpoint}/openai/deployments/{deployment}/extensions/chat/completions?api-version=2024-02-15-preview"

print("Endpoint loaded:", os.getenv("ENDPOINT"))  # debug


headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

body = {
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What are the project milestones?"}
    ],
    "dataSources": [
        {
            "type": "AzureBlobStorage",
            "parameters": {
                "endpoint": os.getenv("STORAGE_ENDPOINT"),
                "container": os.getenv("STORAGE_CONTAINER"),
                "credential": os.getenv("STORAGE_KEY"),
            }
        }
    ]
}

response = requests.post(url, headers=headers, json=body)
print(response.json())

