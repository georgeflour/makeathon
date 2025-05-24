from flask import Blueprint, jsonify, request
from .utils import list_blobs, fetch_blob_content
from openai import AzureOpenAI
import os

openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_KEY"),
    azure_endpoint=os.getenv("ENDPOINT"),
    api_version="2024-02-15-preview"
)

async def get_dataset_summary():
    blobs = await list_blobs()
    if not blobs:
        return {"error": "No blobs found"}
    
    first_blob = blobs[0].name
    content = await fetch_blob_content(first_blob)

    if not content:
        return {"error": "Failed to fetch blob content"}
    
    truncated = content[:3000] + "\n... (truncated)" if len(content) > 3000 else content
    
