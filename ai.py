import os
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_KEY"),           # Your Azure OpenAI API key
    azure_endpoint=os.getenv("ENDPOINT"),     # e.g. "https://YOUR-RESOURCE-NAME.openai.azure.com/"
    api_version="2024-02-15-preview"          # Use the correct API version for your deployment
)

completion = client.chat.completions.create(
    model="makeathongpt41",  # Replace with your exact deployment name!
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Is crete better than athens?"}
    ]
)

print(completion.choices[0].message.content)
