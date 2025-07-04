from flask import Blueprint, jsonify, request
from .dashboard import (
    get_avg_order_value, 
    get_total_revenue, 
    get_active_bundles_count, 
    get_stock_alerts_count,
    get_revenue_trend,
    get_dashboard_data
)

dashboard_bp = Blueprint("Dashboard", __name__)

@dashboard_bp.route("/dashboard/data", methods=["GET"])
def get_all_dashboard_data():
    return get_dashboard_data()

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    try:
        # Get average order value and its change
        avg_order_value = get_avg_order_value()
        
        # Get total revenue and its change
        total_revenue = get_total_revenue()
        
        # Get active bundles count
        active_bundles = get_active_bundles_count()
        
        # Get stock alerts count
        stock_alerts = get_stock_alerts_count()
        
        stats = {
            "avgOrderValue": avg_order_value["current"],
            "aovChange": avg_order_value["change"],
            "totalRevenue": total_revenue["current"],
            "revenueChange": total_revenue["change"],
            "activeBundles": active_bundles,
            "stockAlerts": stock_alerts
        }
        print(stats)
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error getting dashboard stats: {str(e)}")
        return jsonify({"error": "Failed to get dashboard statistics"}), 500

@dashboard_bp.route("/dashboard/revenue-trend", methods=["GET"])
def get_revenue_trend_data():
    try:
        trend_data = get_revenue_trend()
        return jsonify(trend_data), 200
    except Exception as e:
        print(f"Error getting revenue trend: {str(e)}")
        return jsonify({"error": "Failed to get revenue trend data"}), 500
