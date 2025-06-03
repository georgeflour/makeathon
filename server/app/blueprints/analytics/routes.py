from flask import Blueprint, jsonify, request
from .analytics import get_totalsales
from .analytical_ai import ai_call
from .analytics_trend import get_price_trend
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

analytics_bp = Blueprint("Analytics", __name__)

@analytics_bp.route("/analytics/data", methods=["GET"])
def get_analytics_data():
    """
    Combined endpoint that returns all analytics data in a single call
    """
    logger.info("GET /analytics/data request received")
    try:
        # Get total sales
        total_sales = get_totalsales()
        logger.info(f"Total sales: {total_sales}")

        # Get AI prediction
        prediction_result = ai_call(total_sales)
        logger.info(f"AI prediction result: {prediction_result}")

        # Get trend analysis
        trend_result = get_price_trend()
        logger.info(f"Trend analysis result: {trend_result}")

        # Combine all data
        response_data = {
            "total_sales": total_sales,
            "prediction": prediction_result,
            "trend": trend_result
        }

        return jsonify(response_data), 200
    except Exception as e:
        logger.error(f"Error in get_analytics_data: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Keep old endpoints for backward compatibility but mark as deprecated
@analytics_bp.route("/analytics", methods=["GET"])
def classify_item():
    logger.warning("Deprecated endpoint /analytics called - use /analytics/data instead")
    result = get_totalsales()
    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No data available for analysis"}), 404

@analytics_bp.route("/analytics-prediction", methods=["GET"])
def get_prediction():
    logger.warning("Deprecated endpoint /analytics-prediction called - use /analytics/data instead")
    pred_result = ai_call()
    if pred_result and "predicted_revenue" in pred_result:
        return jsonify(pred_result), 200
    else:
        return jsonify({"error": "Prediction failed"}), 500
    
@analytics_bp.route("/analytics-trend", methods=["GET"])
def get_trend_analysis():
    logger.warning("Deprecated endpoint /analytics-trend called - use /analytics/data instead")
    trend_result = get_price_trend()
    if trend_result:
        return jsonify(trend_result), 200
    return jsonify({"error": "Trend identification failed"}), 500