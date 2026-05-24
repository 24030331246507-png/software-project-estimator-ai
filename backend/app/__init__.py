from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .models import db
from .routes.auth import auth_bp
from .routes.predictions import predictions_bp
from .routes.admin import admin_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    db.init_app(app)
    jwt = JWTManager(app)

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": f"Invalid session token: {reason}"}), 422

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"message": "Session expired. Please login again."}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Login required to continue."}), 401

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(predictions_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Cost & Time Project Analysis"})

    with app.app_context():
        db.create_all()

    return app
