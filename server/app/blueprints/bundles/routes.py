from flask import Blueprint, jsonify, request
from .ai import get_results_from_ai, return_some_data

bundles_bp = Blueprint("Bundles", __name__)

@bundles_bp.route("/bundles", methods=["GET"])
def classify_item():
    # result = get_results_from_ai()
    result = get_results_from_ai()
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No bundles found"}), 404
