from flask import Blueprint, jsonify, request
from .ai import get_results_from_ai
from .optimise_bundles import optimize_bundles
import json
from datetime import datetime
import sqlite3
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bundles_bp = Blueprint("Bundles", __name__)


def get_db_connection():
    logger.debug("Opening database connection")
    conn = sqlite3.connect("bundles.db")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bundles
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         bundle_data TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS favorites
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         bundle_id TEXT NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         UNIQUE(bundle_id))
    """
    )

    conn.commit()
    conn.close()


# Initialize the database when the blueprint is created
init_db()


@bundles_bp.route("/bundles", methods=["GET"])
def get_bundles():
    logger.info("GET /bundles request received")
    try:
        conn = get_db_connection()
        # Get the most recent bundle set
        result = conn.execute(
            "SELECT bundle_data FROM bundles ORDER BY created_at DESC LIMIT 1"
        ).fetchone()
        conn.close()

        if result:
            logger.info("Found existing bundles in database")
            return jsonify(json.loads(result["bundle_data"])), 200
        else:
            logger.info("No bundles found in database")
            return jsonify({"bundles": []}), 200
    except Exception as e:
        logger.error(f"Error in get_bundles: {e}")
        return jsonify({"error": str(e)}), 500


@bundles_bp.route("/bundles/generate", methods=["POST"])
def generate_bundles():
    logger.info("POST /bundles/generate request received")
    try:
        request_data = request.get_json() or {}
        logger.info(f"Request data: {request_data}")

        # Map frontend parameters to AI function parameters
        product_to_clear = request_data.get("product_to_clear")
        # Strip '%' symbol if present and convert to string
        target_profit_margin_input = str(request_data.get("target_profit_margin_input", "35"))
        bundle_size = request_data.get("bundle_size", 10)

        logger.info(f"Parameters: product_to_clear={product_to_clear}, margin={target_profit_margin_input}, size={bundle_size}")

        # Then get AI results
        logger.info("Calling get_results_from_ai")
        result = get_results_from_ai(
            product_to_clear=product_to_clear,
            target_profit_margin_input=target_profit_margin_input,
            top_n=bundle_size
        )
        logger.info("Successfully got results from AI")

        if result:
            # Store the new bundles in the database
            logger.info("Storing bundles in database")
            conn = get_db_connection()
            conn.execute("INSERT INTO bundles (bundle_data) VALUES (?)", [json.dumps(result)])
            conn.commit()
            conn.close()
            logger.info("Successfully stored bundles in database")
            return jsonify(result), 200
        else:
            logger.error("AI returned no results")
            return jsonify({"error": "Failed to generate bundles"}), 500
    except Exception as e:
        logger.error(f"Error in generate_bundles: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bundles_bp.route("/bundles/delete", methods=["POST"])
def delete_bundles():
    try:
        request_data = request.get_json()
        bundle_id = request_data.get("bundle_id")

        if not bundle_id:
            return jsonify({"error": "No bundle_id provided"}), 400

        conn = get_db_connection()
        # Get the most recent bundle set
        result = conn.execute(
            "SELECT id, bundle_data FROM bundles ORDER BY created_at DESC LIMIT 1"
        ).fetchone()

        if not result:
            return jsonify({"error": "No bundles found"}), 404

        # Parse the JSON data
        bundles_data = json.loads(result["bundle_data"])

        # Filter out the bundle to delete
        bundles_data["bundles"] = [
            b for b in bundles_data["bundles"] if b["bundle_id"] != bundle_id
        ]

        # Update the database with the new bundles data
        conn.execute(
            "UPDATE bundles SET bundle_data = ? WHERE id = ?",
            (json.dumps(bundles_data), result["id"]),
        )
        conn.commit()
        conn.close()

        return jsonify({"message": "Bundle deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_bundles: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bundles_bp.route("/bundles/data", methods=["POST"])
def get_data_user():
    request_data = request.get_json()

    if not request_data:
        return jsonify({"error": "No data provided"}), 400

    # Extract parameters from frontend
    product_name = request_data.get("product_name")
    profit_margin = request_data.get("profit_margin", 35)
    quantity = request_data.get("quantity", 2)

    # Call get_results_from_ai with the correct parameters
    result = get_results_from_ai(
        product_to_clear=product_name,
        target_profit_margin_input=str(profit_margin),
        top_n=quantity
    )

    if result:
        return jsonify(result), 200
    else:
        return jsonify({"error": "No bundles found"}), 404


@bundles_bp.route("/bundles/favorite/<bundle_id>", methods=["GET"])
def get_favorite_status(bundle_id):
    try:
        conn = get_db_connection()
        result = conn.execute(
            "SELECT id FROM favorites WHERE bundle_id = ?", (bundle_id,)
        ).fetchone()
        conn.close()
        return jsonify({"is_favorite": bool(result)}), 200
    except Exception as e:
        print(f"Error getting favorite status: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bundles_bp.route("/bundles/favorite", methods=["POST"])
def toggle_favorite():
    try:
        request_data = request.get_json()
        bundle_id = request_data.get("bundle_id")
        is_favorite = request_data.get("is_favorite")

        if not bundle_id:
            return jsonify({"error": "No bundle_id provided"}), 400

        conn = get_db_connection()
        if is_favorite:
            conn.execute("INSERT OR IGNORE INTO favorites (bundle_id) VALUES (?)", (bundle_id,))
        else:
            conn.execute("DELETE FROM favorites WHERE bundle_id = ?", (bundle_id,))

        conn.commit()
        conn.close()
        return jsonify({"message": "Favorite status updated successfully"}), 200
    except Exception as e:
        print(f"Error updating favorite status: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bundles_bp.route("/bundles/favorites", methods=["GET"])
def get_favorite_bundles():
    try:
        conn = get_db_connection()
        # Get the most recent bundle set
        bundles_result = conn.execute(
            "SELECT bundle_data FROM bundles ORDER BY created_at DESC LIMIT 1"
        ).fetchone()

        if not bundles_result:
            return jsonify({"bundles": []}), 200

        # Get all favorite bundle IDs
        favorites = conn.execute("SELECT bundle_id FROM favorites").fetchall()
        favorite_ids = [row["bundle_id"] for row in favorites]

        # Parse the bundles data and filter for favorites
        all_bundles = json.loads(bundles_result["bundle_data"])
        favorite_bundles = {
            "bundles": [
                bundle for bundle in all_bundles["bundles"] if bundle["bundle_id"] in favorite_ids
            ]
        }

        conn.close()
        return jsonify(favorite_bundles), 200
    except Exception as e:
        print(f"Error getting favorite bundles: {str(e)}")
        return jsonify({"error": str(e)}), 500
