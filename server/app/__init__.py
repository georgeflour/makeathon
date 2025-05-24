from flask import Flask
from flask_cors import CORS

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    CORS(app)
    # Import Blueprints
    from app.blueprints.bundles.routes import bundles_bp


    # Register Blueprints
    app.register_blueprint(bundles_bp)

    return app