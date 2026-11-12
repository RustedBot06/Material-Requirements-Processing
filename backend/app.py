import os
import sys
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import config
from database.connection import check_schema_compatibility
from routes.materials import materials_bp
from routes.products import products_bp
from routes.bom import bom_bp
from routes.production import production_bp
from routes.analytics import analytics_bp

def create_app() -> Flask:
    """
    Factory function to initialize and configure the Flask Chips MRP application.
    """
    app = Flask(__name__)
    app.secret_key = config.SECRET_KEY

    # Configure CORS for plug-and-play frontend communication
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})

    # Verify database configuration
    try:
        config.validate_database_exists()
        compat = check_schema_compatibility()
        if not compat["compatible"]:
            print(
                f"[WARNING] Database at {compat['database_path']} is missing tables: "
                f"{compat['missing_tables']}",
                file=sys.stderr,
            )
        else:
            print(f"[Chips MRP Backend] Database verified at {compat['database_path']}")
    except Exception as e:
        print(f"[Chips MRP Backend] Database verification error: {e}", file=sys.stderr)

    # Register modular blueprints with /api prefix
    app.register_blueprint(materials_bp, url_prefix="/api")
    app.register_blueprint(products_bp, url_prefix="/api")
    app.register_blueprint(bom_bp, url_prefix="/api")
    app.register_blueprint(production_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    # Health & System Status Endpoint
    @app.route("/api/health", methods=["GET"])
    def health():
        compat = check_schema_compatibility()
        return jsonify({
            "status": "healthy" if compat["compatible"] else "degraded",
            "backend": "Python Flask (Modular Architecture)",
            "database": {
                "path": str(config.DB_PATH),
                "compatible": compat["compatible"],
                "tables": compat["existing_tables"],
            },
        })

    # Central Error Handlers
    @app.errorhandler(400)
    def handle_bad_request(err):
        return jsonify({"error": getattr(err, "description", "Bad Request"), "status": 400}), 400

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"error": getattr(err, "description", "Resource Not Found"), "status": 404}), 404

    @app.errorhandler(409)
    def handle_conflict(err):
        return jsonify({"error": getattr(err, "description", "Conflict"), "status": 409}), 409

    @app.errorhandler(500)
    def handle_internal_error(err):
        return jsonify({"error": "Internal server error occurred in Python backend.", "status": 500}), 500

    return app

app = create_app()

if __name__ == "__main__":
    print(f"[Chips MRP Backend] Starting Flask server on http://{config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG, use_reloader=False)
