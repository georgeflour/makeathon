from flask import Blueprint, jsonify, request
from app.data_store import data_cache
import os
from openai import AzureOpenAI
from.classify import get_results_from_ai

classify_bp = Blueprint("classify", __name__)

@classify_bp.route("/classify", methods=["GET"])
def classify_item():
    result = get_results_from_ai()

    if result:
        return jsonify(result)

# @classify_bp.route("/classify", methods=["POST"])
# # def classify_item():
# #     index = request.json.get("index", 0)

# #     if not data_cache["dataset_rows"]:
# #         return jsonify({"error": "No dataset loaded"}), 400

# #     try:
# #         row = data_cache["dataset_rows"][index]

# #         openai_client = AzureOpenAI(
# #             api_key=os.getenv("AZURE_KEY"),
# #             azure_endpoint=os.getenv("ENDPOINT"),
# #             api_version="2024-02-15-preview"
# #         )

# #         system_msg = f"""Είσαι ένα σύστημα κατηγοριοποίησης. Βρες κατηγορία για το προϊόν:

# # SKU: {row.get("SKU")}
# # Τίτλος: {row.get("Item title")}
# # Brand: {row.get("Brand")}
# # Κατηγορία: {row.get("Category")}
# # """

# #         completion = openai_client.chat.completions.create(
# #             model="makeathongpt41",
# #             messages=[
# #                 {"role": "system", "content": system_msg},
# #                 {"role": "user", "content": "Ποια είναι η σωστή κατηγορία για το προϊόν;"}
# #             ]
# #         )

# #         return jsonify({
# #             "input": row,
# #             "classification": completion.choices[0].message.content
# #         })
# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500

