"""React single-page application routes."""

from pathlib import Path

from flask import Flask, send_from_directory


PAGE_ROUTES = {
    "/": "index",
    "/home": "home",
    "/team": "team",
    "/features": "features",
    "/research": "research",
    "/faq": "faq",
    "/feedback": "feedback",
    "/profile": "profile",
}


def register_page_routes(app: Flask) -> None:
    """Serve one compiled React application for every client-side route."""
    frontend_dist = Path(app.config["FRONTEND_DIST_DIR"])

    def serve_react_app():
        return send_from_directory(frontend_dist, "index.html")

    for rule, endpoint in PAGE_ROUTES.items():
        app.add_url_rule(rule, endpoint=endpoint, view_func=serve_react_app, methods=["GET"])
