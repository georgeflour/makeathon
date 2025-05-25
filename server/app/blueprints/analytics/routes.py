from flask import Blueprint, jsonify, request
# from .ai import get_results_from_ai, return_some_data
from .analytics import get_totalsales
from .analytical_ai import ai_call
from .analytics_trend import get_price_trend
analytics_bp = Blueprint("Analytics", __name__)

@analytics_bp.route("/analytics", methods=["GET"])
def classify_item():
    # result = get_results_from_ai()
    result = get_totalsales()
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No data available for analysis"}), 404

@analytics_bp.route("/analytics-prediction", methods=["GET"])
def get_prediction():
    pred_result = ai_call()  # This should return {"predicted_revenue": 123456.78}
    if pred_result and "predicted_revenue" in pred_result:
        return jsonify(pred_result), 200
    else:
        return jsonify({"error": "Prediction failed"}), 500
    
@analytics_bp.route("/analytics-trend", methods=["GET"])
def get_price_trend():
    trend_result = get_price_trend()  
    if trend_result and "trend_percentage" in trend_result:
        return jsonify(trend_result), 200
    else:
        return jsonify({"error": "Trend identification failed"}), 500