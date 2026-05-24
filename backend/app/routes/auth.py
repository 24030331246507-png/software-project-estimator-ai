from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app.models import User, db

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    required = ["name", "email", "password"]
    if any(not data.get(field) for field in required):
        return jsonify({"message": "Name, email and password are required."}), 400
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"message": "Email is already registered."}), 409
    role = "admin" if User.query.count() == 0 else "user"
    user = User(name=data["name"], email=data["email"].lower(), role=role)
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    user = User.query.filter_by(email=(data.get("email") or "").lower()).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"message": "Invalid email or password."}), 401
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.to_dict())
