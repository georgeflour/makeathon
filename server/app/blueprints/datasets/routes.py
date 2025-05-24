# from flask import Blueprint, jsonify
# import asyncio
# import csv
# import io
# import threading
# from concurrent.futures import ThreadPoolExecutor

# from app.data_store import data_cache
# from .utils import list_blobs, fetch_blob_content

# datasets_bp = Blueprint("datasets", __name__)

# def run_async_in_thread(coro):
#     """Τρέχει async function σε ξεχωριστό thread"""
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#     try:
#         return loop.run_until_complete(coro)
#     finally:
#         loop.close()

# async def fetch_dataset_data():
#     """Async function για fetch των δεδομένων"""
#     blobs = await list_blobs()
#     if not blobs:
#         return None, "No blobs found"

#     blob_name = blobs[0].name
#     content = await fetch_blob_content(blob_name)

#     if not content:
#         return None, "Could not read blob"

#     return {"blob_name": blob_name, "content": content}, None

# @datasets_bp.route("/datasets", methods=["GET"])
# def get_dataset():
#     # Αν έχουμε ήδη το dataset στη μνήμη, επιστρέφουμε άμεσα
#     if data_cache["loaded"]:
#         return jsonify({
#             "filename": data_cache["filename"],
#             "rows": data_cache["dataset_rows"]
#         })

#     try:
#         # Τρέχουμε το async code σε ξεχωριστό thread
#         with ThreadPoolExecutor() as executor:
#             future = executor.submit(run_async_in_thread, fetch_dataset_data())
#             result, error = future.result(timeout=30)  # 30s timeout

#         if error:
#             return jsonify({"error": error}), 500

#         blob_name = result["blob_name"]
#         content = result["content"]

#         # Γρήγορο parsing σε Python dicts
#         csv_reader = csv.DictReader(io.StringIO(content))
#         rows = list(csv_reader)

#         # Cache στη μνήμη
#         data_cache["dataset_rows"] = rows
#         data_cache["filename"] = blob_name
#         data_cache["loaded"] = True

#         return jsonify({"filename": blob_name, "rows": rows})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

from flask import Blueprint, jsonify, request
from .utils import list_blobs, fetch_blob_content
from openai import AzureOpenAI
import os

datasets_bp = Blueprint("Datasets", __name__)

openai_client = AzureOpenAI(
    api_key=os.getenv("AZURE_KEY"),
    azure_endpoint=os.getenv("ENDPOINT"),
    api_version="2024-02-15-preview"
)

@datasets_bp.route("/datasets", methods=["GET"])
async def get_dataset_summary():
    blobs = await list_blobs()
    if not blobs:
        return jsonify({"error": "No blobs found"}), 404
    
    first_blob = blobs[0].name
    content = await fetch_blob_content(first_blob)
    
    if not content:
        return jsonify({"error": "Could not read blob"}), 500

    truncated = content[:3000] + "\n... (truncated)" if len(content) > 3000 else content

    system_message = f"""You are a helpful assistant. Dataset from blob:
Filename: {first_blob}
Content:
{truncated}
Answer questions based on this data."""

    completion = openai_client.chat.completions.create(
        model="makeathongpt41",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": "Give me an item from the dataset"}
        ]
    )

    return jsonify({"result": completion.choices[0].message.content})
