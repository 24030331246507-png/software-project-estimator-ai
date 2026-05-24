from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm.attributes import flag_modified
from app.models import ContactQuery, ProjectAccess, ProjectPrediction, db
from app.services.ml_service import predict_project, train_and_save_model, train_from_csv
from app.services.pdf_service import generate_prediction_report
from app.services.pert_cpm import build_schedule
from app.services.project_intelligence import (
    analyze_project_problems,
    apply_realtime_factors,
    compute_health_score,
    generate_project_code,
    optimize_inputs,
    simulate_delay,
)

predictions_bp = Blueprint("predictions", __name__)


def _value_or_default(data, key, default):
    value = data.get(key, default)
    return default if value in ("", None) else value


def _prediction_payload(data):
    return {
        "team_experience": float(_value_or_default(data, "teamExperience", 5)),
        "features": int(_value_or_default(data, "features", 30)),
        "integrations": int(_value_or_default(data, "integrations", 4)),
        "team_velocity": float(_value_or_default(data, "teamVelocity", 28)),
        "requirements_volatility": float(_value_or_default(data, "requirementsVolatility", 25)),
        "security_level": int(_value_or_default(data, "securityLevel", 3)),
        "reuse_percent": float(_value_or_default(data, "reusePercent", 15)),
        "estimated_kloc": float(_value_or_default(data, "estimatedKloc", 22)),
        "complexity": _value_or_default(data, "complexity", "Medium"),
        "domain": _value_or_default(data, "domain", "Enterprise"),
        "methodology": _value_or_default(data, "methodology", "Agile"),
        "weather_risk": float(_value_or_default(data, "weatherRisk", 20)),
        "material_cost_index": float(_value_or_default(data, "materialCostIndex", 100)),
        "vendor_reliability": float(_value_or_default(data, "vendorReliability", 75)),
        "regulatory_delay_risk": float(_value_or_default(data, "regulatoryDelayRisk", 20)),
        "right_of_way_risk": float(_value_or_default(data, "rightOfWayRisk", 20)),
    }


def _can_access(prediction, user_id):
    if prediction.user_id == user_id:
        return True
    return ProjectAccess.query.filter_by(user_id=user_id, prediction_id=prediction.id).first() is not None


def _accessible_records(user_id, limit=100):
    owned = (
        ProjectPrediction.query.filter_by(user_id=user_id)
        .order_by(ProjectPrediction.created_at.desc())
        .limit(limit)
        .all()
    )
    shared_ids = [access.prediction_id for access in ProjectAccess.query.filter_by(user_id=user_id).all()]
    shared = ProjectPrediction.query.filter(ProjectPrediction.id.in_(shared_ids)).all() if shared_ids else []
    records = {record.id: record for record in owned + shared}
    return sorted(records.values(), key=lambda item: item.created_at, reverse=True)


def _build_variance(result, pert=None):
    actuals = result.get("actuals") or {}
    predicted_cost = float(result.get("costUsd") or 0)
    predicted_timeline = float(result.get("timelineWeeks") or 0)
    tasks = (pert or {}).get("tasks") or []
    predicted_progress = 100 if tasks and all((task.get("status") == "Completed" or float(task.get("progress") or 0) >= 100) for task in tasks) else 0
    if tasks:
        predicted_progress = round(sum(float(task.get("progress") or 0) for task in tasks) / len(tasks), 1)

    actual_cost = actuals.get("actualCostUsd")
    actual_timeline = actuals.get("actualTimelineWeeks")
    actual_progress = actuals.get("actualProgressPercent")

    cost_variance = None if actual_cost is None else round(float(actual_cost) - predicted_cost, 2)
    timeline_variance = None if actual_timeline is None else round(float(actual_timeline) - predicted_timeline, 2)
    progress_gap = None if actual_progress is None else round(float(actual_progress) - predicted_progress, 2)

    return {
        "predictedCostUsd": round(predicted_cost, 2),
        "actualCostUsd": actual_cost,
        "costVarianceUsd": cost_variance,
        "costVariancePercent": None if cost_variance is None or predicted_cost == 0 else round((cost_variance / predicted_cost) * 100, 2),
        "predictedTimelineWeeks": round(predicted_timeline, 2),
        "actualTimelineWeeks": actual_timeline,
        "timelineVarianceWeeks": timeline_variance,
        "timelineVariancePercent": None if timeline_variance is None or predicted_timeline == 0 else round((timeline_variance / predicted_timeline) * 100, 2),
        "plannedProgressPercent": predicted_progress,
        "actualProgressPercent": actual_progress,
        "progressGapPercent": progress_gap,
        "status": "On Track" if (
            (cost_variance is None or cost_variance <= predicted_cost * 0.1)
            and (timeline_variance is None or timeline_variance <= predicted_timeline * 0.1)
            and (progress_gap is None or progress_gap >= -10)
        ) else "Needs Attention",
        "notes": actuals.get("notes", ""),
    }


@predictions_bp.post("/predict")
@jwt_required()
def predict():
    data = request.get_json() or {}
    project_name = (data.get("projectName") or "Untitled Project").strip()
    inputs = _prediction_payload(data)
    result = apply_realtime_factors(predict_project(inputs), inputs)
    pert = None
    if data.get("tasks"):
        pert = build_schedule(data["tasks"])
        result["timelineWeeks"] = max(result["timelineWeeks"], pert["projectDuration"])
    result["projectCode"] = generate_project_code()
    result["health"] = compute_health_score(result, pert)
    record = ProjectPrediction(
        user_id=int(get_jwt_identity()),
        project_name=project_name,
        methodology=inputs["methodology"],
        domain=inputs["domain"],
        complexity=inputs["complexity"],
        inputs_json=inputs,
        result_json=result,
        pert_json=pert,
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@predictions_bp.get("/history")
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    return jsonify([record.to_dict() for record in _accessible_records(user_id, limit=50)])


@predictions_bp.get("/problems")
@jwt_required()
def problems():
    return jsonify(analyze_project_problems(_accessible_records(int(get_jwt_identity()))))


@predictions_bp.post("/contact")
def create_contact_query():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    query_type = (data.get("queryType") or "").strip()
    message = (data.get("message") or "").strip()
    if not all([name, email, query_type, message]):
        return jsonify({"message": "Name, email, query type and message are required."}), 400
    query = ContactQuery(name=name, email=email, query_type=query_type, message=message)
    db.session.add(query)
    db.session.commit()
    return jsonify({
        "message": "Your query was saved. Admin can review it from the dashboard.",
        "query": query.to_dict(),
    }), 201


@predictions_bp.post("/pert-cpm")
@jwt_required()
def pert_cpm():
    data = request.get_json() or {}
    try:
        return jsonify(build_schedule(data.get("tasks", [])))
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400


@predictions_bp.get("/reports/<int:prediction_id>")
@jwt_required()
def report(prediction_id):
    prediction = ProjectPrediction.query.get_or_404(prediction_id)
    if not _can_access(prediction, int(get_jwt_identity())):
        return jsonify({"message": "Access denied."}), 403
    path = generate_prediction_report(prediction)
    return send_file(path, as_attachment=True, download_name=f"{prediction.project_name}_estimate.pdf")


@predictions_bp.post("/train")
@jwt_required()
def train():
    model = train_and_save_model()
    return jsonify({"message": "Model trained and saved.", "metrics": model["metrics"]})


@predictions_bp.post("/train/upload")
@jwt_required()
def train_upload():
    uploaded = request.files.get("dataset")
    if not uploaded:
        return jsonify({"message": "Upload a CSV file using the field name 'dataset'."}), 400
    if not uploaded.filename.lower().endswith(".csv"):
        return jsonify({"message": "Only CSV datasets are supported."}), 400
    try:
        model = train_from_csv(uploaded)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify({"message": "Model retrained from uploaded CSV.", "metrics": model["metrics"]})


@predictions_bp.post("/projects/join")
@jwt_required()
def join_project():
    data = request.get_json() or {}
    code = (data.get("projectCode") or "").strip().upper()
    if not code:
        return jsonify({"message": "Project code is required."}), 400
    prediction = None
    for record in ProjectPrediction.query.order_by(ProjectPrediction.created_at.desc()).limit(300).all():
        if (record.result_json or {}).get("projectCode") == code:
            prediction = record
            break
    if not prediction:
        return jsonify({"message": "Project code not found."}), 404
    user_id = int(get_jwt_identity())
    if prediction.user_id == user_id:
        return jsonify({"message": "You already own this project.", "project": prediction.to_dict()})
    existing = ProjectAccess.query.filter_by(user_id=user_id, prediction_id=prediction.id).first()
    if not existing:
        db.session.add(ProjectAccess(user_id=user_id, prediction_id=prediction.id, access_role="viewer"))
        db.session.commit()
    return jsonify({"message": "Project access granted.", "project": prediction.to_dict()})


@predictions_bp.post("/projects/<int:prediction_id>/simulate-delay")
@jwt_required()
def delay_simulation(prediction_id):
    prediction = ProjectPrediction.query.get_or_404(prediction_id)
    if not _can_access(prediction, int(get_jwt_identity())):
        return jsonify({"message": "Access denied."}), 403
    data = request.get_json() or {}
    try:
        result = simulate_delay(prediction, data.get("taskId", ""), float(data.get("delayWeeks", 1)))
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    return jsonify(result)


@predictions_bp.post("/projects/<int:prediction_id>/optimize")
@jwt_required()
def optimize_project(prediction_id):
    prediction = ProjectPrediction.query.get_or_404(prediction_id)
    if not _can_access(prediction, int(get_jwt_identity())):
        return jsonify({"message": "Access denied."}), 403
    optimized_inputs = optimize_inputs(prediction.inputs_json)
    optimized_result = apply_realtime_factors(predict_project(optimized_inputs), optimized_inputs)
    optimized_result["projectCode"] = prediction.result_json.get("projectCode")
    optimized_result["health"] = compute_health_score(optimized_result, prediction.pert_json)
    return jsonify({
        "before": prediction.result_json,
        "after": optimized_result,
        "optimizedInputs": optimized_inputs,
        "changes": [
            "Reduced requirements volatility",
            "Increased reusable component percentage",
            "Improved expected team velocity",
            "Added senior-experience uplift",
        ],
    })


@predictions_bp.patch("/projects/<int:prediction_id>/actuals")
@jwt_required()
def update_project_actuals(prediction_id):
    prediction = ProjectPrediction.query.get_or_404(prediction_id)
    if not _can_access(prediction, int(get_jwt_identity())):
        return jsonify({"message": "Access denied."}), 403

    data = request.get_json() or {}
    result = dict(prediction.result_json or {})
    actuals = dict(result.get("actuals") or {})

    if "actualCostUsd" in data:
        actuals["actualCostUsd"] = max(0, float(data.get("actualCostUsd") or 0))
    if "actualTimelineWeeks" in data:
        actuals["actualTimelineWeeks"] = max(0, float(data.get("actualTimelineWeeks") or 0))
    if "actualProgressPercent" in data:
        actuals["actualProgressPercent"] = max(0, min(100, float(data.get("actualProgressPercent") or 0)))
    if "notes" in data:
        actuals["notes"] = (data.get("notes") or "").strip()

    result["actuals"] = actuals
    result["variance"] = _build_variance(result, prediction.pert_json)
    prediction.result_json = result
    flag_modified(prediction, "result_json")
    db.session.commit()
    return jsonify(prediction.to_dict())


@predictions_bp.patch("/projects/<int:prediction_id>/tasks/<task_id>")
@jwt_required()
def update_project_task(prediction_id, task_id):
    prediction = ProjectPrediction.query.get_or_404(prediction_id)
    if not _can_access(prediction, int(get_jwt_identity())):
        return jsonify({"message": "Access denied."}), 403
    if not prediction.pert_json or not prediction.pert_json.get("tasks"):
        return jsonify({"message": "This project does not have tracked tasks."}), 400

    data = request.get_json() or {}
    allowed_statuses = {"Pending", "In Progress", "Completed", "Blocked"}
    updated = False
    source_tasks = prediction.pert_json["tasks"]
    for task in source_tasks:
        if str(task.get("id")) != str(task_id):
            continue
        if "assignedTo" in data:
            task["assignedTo"] = (data.get("assignedTo") or "Unassigned").strip()
        if "role" in data:
            task["role"] = (data.get("role") or "Team").strip()
        if "status" in data:
            status = data.get("status") or "Pending"
            if status not in allowed_statuses:
                return jsonify({"message": "Invalid task status."}), 400
            task["status"] = status
        if "progress" in data:
            task["progress"] = max(0, min(100, float(data.get("progress") or 0)))
        updated = True
        break

    if not updated:
        return jsonify({"message": "Task not found."}), 404

    prediction.pert_json = build_schedule(source_tasks)
    result = dict(prediction.result_json or {})
    result["health"] = compute_health_score(result, prediction.pert_json)
    prediction.result_json = result
    flag_modified(prediction, "pert_json")
    flag_modified(prediction, "result_json")
    db.session.commit()
    return jsonify(prediction.to_dict())
