from flask import Flask

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Import Blueprints
    from app.blueprints.inventory.routes import inventory_bp

    # Register Blueprints
    app.register_blueprint(inventory_bp)

    return app