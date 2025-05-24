import os
from azure.storage.blob.aio import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

blob_service_client = BlobServiceClient(
    account_url=os.getenv("STORAGE_ENDPOINT"),
    credential=os.getenv("STORAGE_KEY")
)

container_name = os.getenv("STORAGE_CONTAINER")

async def list_blobs():
    try:
        container_client = blob_service_client.get_container_client(container_name)
        blob_list = container_client.list_blobs()
        return [blob async for blob in blob_list]
    except Exception as e:
        print(f"Error listing blobs: {e}")
        return []

async def fetch_blob_content(blob_name):
    try:
        blob_client = blob_service_client.get_blob_client(container_name, blob_name)
        stream = await blob_client.download_blob()
        data = await stream.readall()
        return data.decode('utf-8')
    except Exception as e:
        print(f"Error fetching blob content: {e}")
        return None
