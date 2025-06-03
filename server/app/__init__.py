from flask import Flask
from flask_cors import CORS


def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    CORS(app)
    # Import Blueprints
    from .blueprints.bundles.routes import bundles_bp
    from .blueprints.inventory.routes import inventory_bp
    from .blueprints.analytics.routes import analytics_bp
    from .blueprints.dashboard.routes import dashboard_bp
    
    # Register Blueprints
    app.register_blueprint(bundles_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(dashboard_bp)

    return app
