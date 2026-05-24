from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required
from app.models import ContactQuery, ProjectPrediction, User

admin_bp = Blueprint("admin", __name__)


def _admin_only():
    return get_jwt().get("role") == "admin"


@admin_bp.get("/summary")
@jwt_required()
def summary():
    if not _admin_only():
        return jsonify({"message": "Admin access required."}), 403
    predictions = ProjectPrediction.query.order_by(ProjectPrediction.created_at.desc()).limit(100).all()
    avg_cost = sum(p.result_json.get("costUsd", 0) for p in predictions) / max(len(predictions), 1)
    avg_success = sum(p.result_json.get("successProbability", 0) for p in predictions) / max(len(predictions), 1)
    risk_counts = {}
    for prediction in predictions:
        risk = prediction.result_json.get("riskLevel", "Unknown")
        risk_counts[risk] = risk_counts.get(risk, 0) + 1
    return jsonify({
        "users": User.query.count(),
        "predictions": ProjectPrediction.query.count(),
        "contactQueries": ContactQuery.query.count(),
        "averageCost": round(avg_cost, 2),
        "averageSuccess": round(avg_success, 1),
        "riskCounts": risk_counts,
        "recent": [prediction.to_dict() for prediction in predictions[:10]],
        "recentContactQueries": [
            query.to_dict()
            for query in ContactQuery.query.order_by(ContactQuery.created_at.desc()).limit(20).all()
        ],
    })
