"""Flask application factory for EMORA."""

import os

from flask import Flask, jsonify

from backend.app.config import Config
from backend.app.routes.pages import register_page_routes
from backend.app.routes.predictions import register_prediction_routes
from backend.app.services.emotion_service import preload_models


def create_app(config_object: type[Config] = Config) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(
        __name__,
        static_folder=str(Config.FRONTEND_DIST_DIR),
        static_url_path="/app",
    )
    app.config.from_object(config_object)

    # Loading TensorFlow on the first capture caused a 40–60 second request.
    # Load and trace it once during startup so webcam/image requests are immediate.
    if os.environ.get("EMORA_PRELOAD_MODEL", "1") == "1":
        try:
            print("EMORA: loading and warming the emotion model once for instant predictions...")
            preload_models()
        except FileNotFoundError as exc:
            app.logger.warning("EMORA model preload skipped: %s", exc)
        except Exception:
            app.logger.exception("EMORA model preload failed; prediction routes remain available")

    register_page_routes(app)
    register_prediction_routes(app)

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy", "service": "EMORA API"})

    return app


__all__ = ["create_app"]
