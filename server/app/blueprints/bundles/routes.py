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
    
@bundles_bp.route("/bundles/data", methods=["POST"])
def get_data_user():
    request_data = request.get_json()

    if not request_data:
        return jsonify({"error": "No data provided"}), 400

    # Extract parameters from frontend
    product_id = request_data.get("product_id")
    profit_margin = request_data.get("profit_margin", 0)
    objective = request_data.get("objective", "Max Cart")
    quantity = request_data.get("quantity", 2)
    duration = request_data.get("timeframe", "1 month")
    bundle_type = request_data.get("bundle_type", "complementary")

    # Call your backend function with these parameters
    # Example: result = your_function(product_id, warehouse_id, include_stock_alerts, category, price_range)
    # For now, just return the received data
    response = {
        "product_id": product_id,
        "profit_margin": profit_margin,
        "objective": objective,
        "quantity": quantity,
        "timeframe": duration,
        "bundle_type": bundle_type,
    }

    return jsonify(response), 200


"""
Product
Profit Margin [0 - 35] %
Objective ==> 1) Max Cart
              2) Sell Out
Quantity Products in the bundle 2+
Timeframe / Duration
Bundle Type ==> 1) complmentary 2) thematic 3) seasonal 4) cross-sell 5) upsell
"""