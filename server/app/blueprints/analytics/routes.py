from flask import Blueprint, jsonify, request
# from .ai import get_results_from_ai, return_some_data
from .analytics import get_prediction
bundles_bp = Blueprint("Analytics", __name__)

@bundles_bp.route("/analytics", methods=["GET"])
def classify_item():
    # result = get_results_from_ai()
    result = get_prediction()
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No data available for analysis"}), 404
