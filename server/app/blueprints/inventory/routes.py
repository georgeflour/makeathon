from flask import Blueprint, jsonify, request
from app.blueprints.inventory.inventory import getInventory

inventory_bp = Blueprint('Inventory', __name__)

@inventory_bp.route('/inventory', methods=['GET'])
def inventory():
    """
    Endpoint to get the inventory data.
    """
    result = getInventory(dropdown=False)

    if result is None:
        return jsonify({"error": "No inventory data found"}), 404
    else:
        return jsonify(result), 200
    
@inventory_bp.route('/inventory-dropdown', methods=['GET'])
def inventory_dropdown():
    """
    Endpoint to get the inventory data.
    """
    result = getInventory(dropdown=True)

    if result is None:
        return jsonify({"error": "No inventory data found"}), 404
    else:
        return jsonify(result), 200