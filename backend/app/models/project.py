from datetime import datetime
from . import db


class ProjectPrediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    project_name = db.Column(db.String(180), nullable=False)
    methodology = db.Column(db.String(40), nullable=False)
    domain = db.Column(db.String(80), nullable=False)
    complexity = db.Column(db.String(40), nullable=False)
    inputs_json = db.Column(db.JSON, nullable=False)
    result_json = db.Column(db.JSON, nullable=False)
    pert_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        result = dict(self.result_json or {})
        result["projectId"] = f"CTPA-{self.id:05d}" if self.id else "CTPA-PENDING"
        return {
            "id": self.id,
            "projectId": result["projectId"],
            "projectName": self.project_name,
            "methodology": self.methodology,
            "domain": self.domain,
            "complexity": self.complexity,
            "inputs": self.inputs_json,
            "result": result,
            "pert": self.pert_json,
            "createdAt": self.created_at.isoformat(),
        }


class ProjectAccess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey("project_prediction.id"), nullable=False, index=True)
    access_role = db.Column(db.String(30), default="viewer", nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "prediction_id", name="unique_project_member"),)
