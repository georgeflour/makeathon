from flask import Blueprint, jsonify, request
from .ai import get_results_from_ai
import json
from datetime import datetime
import sqlite3

bundles_bp = Blueprint("Bundles", __name__)

def get_db_connection():
    conn = sqlite3.connect('bundles.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS bundles
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         bundle_data TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    conn.commit()
    conn.close()

# Initialize the database when the blueprint is created
init_db()

@bundles_bp.route("/bundles", methods=["GET"])
def get_bundles():
    conn = get_db_connection()
    # Get the most recent bundle set
    result = conn.execute('SELECT bundle_data FROM bundles ORDER BY created_at DESC LIMIT 1').fetchone()
    conn.close()
    
    if result:
        return jsonify(json.loads(result['bundle_data'])), 200
    else:
        return jsonify({"bundles": []}), 200

@bundles_bp.route("/bundles/generate", methods=["POST"])
def generate_bundles():
    try:
        # Generate new bundles using AI
        result = get_results_from_ai()
        
        if result:
            # Store the new bundles in the database
            conn = get_db_connection()
            conn.execute('INSERT INTO bundles (bundle_data) VALUES (?)',
                        [json.dumps(result)])
            conn.commit()
            conn.close()
            return jsonify(result), 200
        else:
            return jsonify({"error": "Failed to generate bundles"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
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