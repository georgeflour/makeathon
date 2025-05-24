
def get_results_from_ai():
    return {
        "bundles": [
            {
                "bundle_id": "bundle1",
                "items": [
                    {"item_id": "item1", "classification": "electronics"},
                    {"item_id": "item2", "classification": "furniture"}
                ],
                "price": 150.00,
                "proiftMargin": 30.00,
                "OriginalPrice": 200.00
            },
            {
                "bundle_id": "bundle2",
                "items": [
                    {"item_id": "item3", "classification": "clothing"},
                    {"item_id": "item4", "classification": "accessories"}
                ],
                "price": 75.00,
                "proiftMargin": 25.00,
                "OriginalPrice": 100.00
            }
        ],
    }

# ---------------------------------------------------------------------------------------- #
"""
Here the response from the AI
"""
import os
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

endpoint = os.environ.get("ENDPOINT")
deployment = "makeathongpt41"  # Update if your deployment name is different!
search_endpoint = os.environ.get("SEARCH_ENDPOINT")
search_index = os.environ.get("SEARCH_INDEX_NAME")
search_key = os.environ.get("SEARCH_KEY")

client = AzureOpenAI(
    api_key=os.environ.get("AZURE_KEY"),
    azure_endpoint=endpoint,
    api_version="2024-05-01-preview",  # Use latest for RAG features
)

completion = client.chat.completions.create(
    model=deployment,
    messages=[
        {
            "role": "user",
            "content": "Give me an item from my blob storage dataset in a json format"
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
    }
)

def return_some_data():
    return completion.choices[0].message.content
# Render the citations (if present)
"""
content = completion.choices[0].message.content
context = getattr(completion.choices[0].message, "context", {})

if context and "citations" in context:
    for citation_index, citation in enumerate(context["citations"]):
        citation_reference = f"[doc{citation_index + 1}]"
        url = "https://example.com/?redirect=" + citation.get("url", "")  # replace with actual host and encode the URL
        filepath = citation.get("filepath", "")
        title = citation.get("title", "")
        snippet = citation.get("content", "")
        chunk_id = citation.get("chunk_id", "")
        replaced_html = f"<a href='{url}' title='{title}\n{snippet}'>(See from file {filepath}, Part {chunk_id})</a>"
        content = content.replace(citation_reference, replaced_html)
print(content)
"""
