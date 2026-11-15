import logging
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from api import register_blueprints
from api.utils import ApiError
from config import Config
from extensions import cors, db, jwt


def _register_errors(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return jsonify(error.to_dict()), error.status

    @app.errorhandler(HTTPException)
    def handle_http(error):
        if request.path.startswith("/api/"):
            return jsonify({"error": error.description, "code": error.name.lower()}), error.code
        return error

    @app.errorhandler(Exception)
    def handle_unexpected(error):
        if isinstance(error, HTTPException):
            return handle_http(error)
        app.logger.exception("Error no controlado")
        if request.path.startswith("/api/"):
            return jsonify({"error": "Ocurrió un error inesperado en el servidor."}), 500
        raise error

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Falta el token de acceso.", "code": "auth_required"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Token inválido.", "code": "invalid_token"}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"error": "La sesión expiró. Vuelve a iniciar sesión.", "code": "token_expired"}), 401


def _register_frontend(app):
    dist = Path(app.config["FRONTEND_DIST"])
    if not dist.is_dir():
        @app.get("/")
        def api_root():
            return jsonify({
                "name": "ROOTWISE AI API",
                "version": "1.0.0",
                "docs": "/api/healthz",
                "message": "Compila el frontend con `npm run build` para servir la interfaz.",
            })
        return

    app.static_folder = str(dist)

    @app.get("/")
    def index():
        return send_from_directory(dist, "index.html")

    @app.get("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            abort(404)
        candidate = dist / path
        if candidate.is_file():
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")


def create_app(overrides=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)
    app.json.sort_keys = False

    logging.basicConfig(level=logging.INFO)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    register_blueprints(app)
    _register_errors(app)

    @app.get("/healthz")
    def healthz():
        return jsonify({"status": "ok", "service": "rootwise-ai", "version": "1.0.0"})

    from cli import register_cli, seed_database

    register_cli(app)

    with app.app_context():
        db.create_all()
        if app.config.get("AUTO_SEED", True):
            seed_database(app)

    _register_frontend(app)
    return app
