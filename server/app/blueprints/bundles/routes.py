from flask import Blueprint, jsonify, request
from .ai import get_results_from_ai

bundles_bp = Blueprint("Bundles", __name__)

@bundles_bp.route("/bundles", methods=["GET"])
def classify_item():
    result = get_results_from_ai()
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No bundles found"}), 404
    
@bundles_bp.route("/bundles/data", methods=["POST"])
def get_data_user():
    request_data = request.get_json()

    if not request_data:
        return jsonify({"error": "No data provided"}), 400

    # Extract parameters from frontend
    product_name = request_data.get("product_name")
    profit_margin = request_data.get("profit_margin", 0)
    objective = request_data.get("objective", "Max Cart")
    quantity = request_data.get("quantity", 2)
    duration = request_data.get("timeframe", "1 month")
    bundle_type = request_data.get("bundle_type", "all")

    if not product_name: # If product name is empty string
        product_name = None

    result = get_results_from_ai(product_name=product_name,
                                 profit_margin=profit_margin,
                                 objective=objective,
                                 quantity=quantity,
                                 duration=duration,
                                 bundle_type=bundle_type)
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No bundles found"}), 404
