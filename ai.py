import os
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.storage.blob import BlobServiceClient

load_dotenv()

# Azure OpenAI client
openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_KEY"),
    azure_endpoint=os.getenv("ENDPOINT"),
    api_version="2024-02-15-preview"
)

# Azure Blob Storage client
blob_service_client = BlobServiceClient(
    account_url=os.getenv("STORAGE_ENDPOINT"),
    credential=os.getenv("STORAGE_KEY")
)

def get_blob_content(container_name, blob_name):
    """Download content from Azure Blob Storage"""
    try:
        blob_client = blob_service_client.get_blob_client(
            container=container_name, 
            blob=blob_name
        )
        
        # Download blob content
        blob_data = blob_client.download_blob()
        content = blob_data.readall().decode('utf-8')
        return content
    except Exception as e:
        print(f"Error accessing blob: {e}")
        return None

def list_blobs_in_container(container_name):
    """List all blobs in a container"""
    try:
        container_client = blob_service_client.get_container_client(container_name)
        blob_list = container_client.list_blobs()
        return [blob.name for blob in blob_list]
    except Exception as e:
        print(f"Error listing blobs: {e}")
        return []

# Get your container name from environment
container_name = os.getenv("STORAGE_CONTAINER")

# List available blobs
print("Available blobs in container:")
blobs = list_blobs_in_container(container_name)
for blob in blobs:
    print(f"- {blob}")

# Read a specific blob (replace 'your-file.csv' with your actual blob name)
if blobs:
    # Use the first blob or specify your blob name
    blob_name = blobs[0]  # or specify: blob_name = "your-specific-file.csv"
    
    print(f"\nReading content from: {blob_name}")
    blob_content = get_blob_content(container_name, blob_name)
    
    if blob_content:
        # Truncate content if too long (GPT has token limits)
        max_content_length = 3000  # Adjust based on your needs
        if len(blob_content) > max_content_length:
            truncated_content = blob_content[:max_content_length] + "\n... (content truncated)"
        else:
            truncated_content = blob_content
        
        # Create system message with the blob content
        system_message = f"""You are a helpful assistant. Here is the dataset from Azure Blob Storage:

Filename: {blob_name}
Content:
{truncated_content}

Answer questions based on this data."""

        # Make the OpenAI call
        completion = openai_client.chat.completions.create(
            model="makeathongpt41",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": "Tell me an item from my dataset"},
            ]
        )
        
        print(f"\nAI Response:")
        print(completion.choices[0].message.content)
    else:
        print("Could not read blob content")
else:
    print("No blobs found in container")