import os
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables from .env file
load_dotenv()

OPENAI_ENDPOINT = os.environ.get("ENDPOINT")
OPENAI_KEY = os.environ.get("AZURE_KEY")
DEPLOYMENT = "gpt-4.1"
SEARCH_ENDPOINT = os.environ.get("SEARCH_ENDPOINT")
SEARCH_INDEX_NAME = os.environ.get("SEARCH_INDEX_NAME")
SEARCH_KEY = os.environ.get("SEARCH_KEY")

def test_azure_openai():
    client = AzureOpenAI(
        api_key=OPENAI_KEY,
        azure_endpoint=OPENAI_ENDPOINT,
        api_version="2024-05-01-preview",
    )

    messages = [
        {"role": "system", "content": "You are an AI assistant that helps people find information."},
        {"role": "user", "content": "Tell me a bundle from my dataset"}
    ]

    extra_body = {
        "data_sources": [{
            "type": "azure_search",
            "parameters": {
                "endpoint": SEARCH_ENDPOINT,
                "index_name": SEARCH_INDEX_NAME,
                "semantic_configuration": "default",
                "query_type": "semantic",
                "fields_mapping": {},
                "in_scope": True,
                "role_information": "You are an AI assistant that helps people find information.",
                "filter": None,
                "strictness": 3,
                "top_n_documents": 5,
                "authentication": {
                    "type": "api_key",
                    "key": SEARCH_KEY
                }
            }
        }]
    }

    try:
        completion = client.chat.completions.create(
            model=DEPLOYMENT,
            messages=messages,
            max_tokens=800,
            temperature=1,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            stop=None,
            stream=False,
            extra_body=extra_body
        )
        print(completion.model_dump_json(indent=2))
    except Exception as e:
        print(f"Error during API Azure call: {e}")

if __name__ == "__main__":
    test_azure_openai()
