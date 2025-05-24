from flask import Flask

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)

    # Import Blueprints
    # from app.blueprints.inventory.routes import inventory_bp
    # from app.blueprints.datasets.routes import datasets_bp
    # from app.blueprints.classify.routes import classify_bp
    from app.blueprints.bundles.routes import bundles_bp


    app.register_blueprint(bundles_bp)
    # Register Blueprints
    # app.register_blueprint(inventory_bp)
    # app.register_blueprint(datasets_bp)
    # app.register_blueprint(classify_bp)

    return app