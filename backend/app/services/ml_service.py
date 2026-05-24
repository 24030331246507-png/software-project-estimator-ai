import os
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from flask import current_app
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPRegressor
from sklearn.exceptions import ConvergenceWarning
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = [
    "team_experience",
    "features",
    "integrations",
    "team_velocity",
    "requirements_volatility",
    "security_level",
    "reuse_percent",
    "estimated_kloc",
]
CATEGORICAL_FEATURES = ["complexity", "domain", "methodology"]
TARGETS = ["cost_usd", "timeline_weeks", "team_size", "success_probability"]


def _synthetic_dataset(rows=900):
    rng = np.random.default_rng(42)
    domains = np.array(["FinTech", "Healthcare", "E-commerce", "Education", "Enterprise", "Advanced Analytics"])
    complexities = np.array(["Low", "Medium", "High", "Critical"])
    methods = np.array(["Agile", "Scrum", "Waterfall", "Hybrid"])
    data = []

    for _ in range(rows):
        complexity = rng.choice(complexities, p=[0.22, 0.38, 0.28, 0.12])
        domain = rng.choice(domains)
        methodology = rng.choice(methods, p=[0.35, 0.32, 0.12, 0.21])
        complexity_factor = {"Low": 0.8, "Medium": 1.1, "High": 1.55, "Critical": 2.1}[complexity]
        domain_factor = {"FinTech": 1.25, "Healthcare": 1.22, "E-commerce": 1.0, "Education": 0.9, "Enterprise": 1.15, "Advanced Analytics": 1.45}[domain]
        method_factor = {"Agile": 0.95, "Scrum": 0.92, "Waterfall": 1.12, "Hybrid": 1.04}[methodology]
        features = int(rng.integers(8, 95))
        integrations = int(rng.integers(1, 18))
        experience = float(rng.uniform(1, 10))
        velocity = float(rng.uniform(12, 55))
        volatility = float(rng.uniform(5, 65))
        security = int(rng.integers(1, 6))
        reuse = float(rng.uniform(0, 55))
        kloc = float(features * rng.uniform(0.35, 1.8) + integrations * rng.uniform(0.8, 3.5))
        scope = features * 900 + integrations * 4200 + kloc * 1800
        cost = scope * complexity_factor * domain_factor * method_factor * (1 + volatility / 180) * (1 + security / 18)
        cost *= max(0.72, 1.18 - reuse / 100) * rng.normal(1, 0.08)
        timeline = (features * complexity_factor * 0.38 + integrations * 1.3 + kloc * 0.2) / max(0.65, velocity / 30)
        timeline *= method_factor * (1 + volatility / 210) * rng.normal(1, 0.07)
        team_size = np.clip(round((cost / 45000) ** 0.45 + timeline / 14 + complexity_factor), 3, 18)
        success = 96 - volatility * 0.35 - complexity_factor * 8 + experience * 2.2 + reuse * 0.12
        success = float(np.clip(success + rng.normal(0, 4), 35, 96))
        data.append([experience, features, integrations, velocity, volatility, security, reuse, kloc, complexity, domain, methodology, cost, timeline, team_size, success])

    columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES + TARGETS
    return pd.DataFrame(data, columns=columns)


def _train_from_dataframe(df, model_path):
    missing = [column for column in NUMERIC_FEATURES + CATEGORICAL_FEATURES + TARGETS if column not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {', '.join(missing)}")

    df = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + TARGETS].dropna()
    if len(df) < 30:
        raise ValueError("Dataset must contain at least 30 complete rows.")

    for column in NUMERIC_FEATURES + TARGETS:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df.dropna()

    x_train, x_test, y_train, y_test = train_test_split(
        df[NUMERIC_FEATURES + CATEGORICAL_FEATURES],
        df[TARGETS],
        test_size=0.18,
        random_state=42,
    )
    preprocess = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )
    rf = Pipeline([
        ("prep", preprocess),
        ("model", RandomForestRegressor(n_estimators=260, min_samples_leaf=2, random_state=42, n_jobs=-1)),
    ])
    mlp = Pipeline([
        ("prep", preprocess),
        ("model", MLPRegressor(hidden_layer_sizes=(96, 48, 24), activation="relu", max_iter=1400, random_state=42)),
    ])
    rf.fit(x_train, y_train)
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=ConvergenceWarning)
        mlp.fit(x_train, y_train)
    rf_pred = rf.predict(x_test)
    mlp_pred = mlp.predict(x_test)
    metrics = {
        "rfR2": float(r2_score(y_test, rf_pred, multioutput="variance_weighted")),
        "mlpR2": float(r2_score(y_test, mlp_pred, multioutput="variance_weighted")),
        "rows": int(len(df)),
    }
    payload = {"rf": rf, "mlp": mlp, "features": NUMERIC_FEATURES + CATEGORICAL_FEATURES, "targets": TARGETS, "metrics": metrics}
    with open(model_path, "wb") as handle:
        pickle.dump(payload, handle)
    return payload


def train_and_save_model(model_path=None):
    model_path = model_path or current_app.config["MODEL_PATH"]
    Path(os.path.dirname(model_path)).mkdir(parents=True, exist_ok=True)
    return _train_from_dataframe(_synthetic_dataset(), model_path)


def train_from_csv(file_storage, model_path=None):
    model_path = model_path or current_app.config["MODEL_PATH"]
    Path(os.path.dirname(model_path)).mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(file_storage)
    return _train_from_dataframe(df, model_path)


def load_model():
    model_path = current_app.config["MODEL_PATH"]
    if not os.path.exists(model_path):
        return train_and_save_model(model_path)
    with open(model_path, "rb") as handle:
        return pickle.load(handle)


def predict_project(payload):
    model = load_model()
    frame = pd.DataFrame([{key: payload[key] for key in model["features"]}])
    rf_pred = model["rf"].predict(frame)[0]
    mlp_pred = model["mlp"].predict(frame)[0]
    pred = (rf_pred * 0.7) + (mlp_pred * 0.3)
    cost, weeks, team_size, success = pred
    risk_score = 100 - success + float(payload["requirements_volatility"]) * 0.28 + int(payload["security_level"]) * 3.0
    if payload["complexity"] == "High":
        risk_score += 8
    elif payload["complexity"] == "Critical":
        risk_score += 16
    if payload["team_velocity"] < 24:
        risk_score += 8
    if payload["team_experience"] < 4:
        risk_score += 7
    if payload["integrations"] >= 8:
        risk_score += 6
    if payload["reuse_percent"] < 15:
        risk_score += 4
    risk_level = "Low" if risk_score < 28 else "Medium" if risk_score < 48 else "High" if risk_score < 68 else "Critical"
    explanation = explain_prediction(payload, cost, weeks, risk_level, risk_score, success)
    return {
        "costUsd": round(float(max(cost, 8000)), 2),
        "timelineWeeks": round(float(max(weeks, 3)), 1),
        "riskLevel": risk_level,
        "riskScore": round(float(np.clip(risk_score, 5, 95)), 1),
        "recommendedTeamSize": int(np.clip(round(team_size), 3, 20)),
        "successProbability": round(float(np.clip(success, 20, 98)), 1),
        "explanation": explanation,
        "modelMetrics": model["metrics"],
    }


def explain_prediction(payload, cost, weeks, risk_level, risk_score, success):
    drivers = []
    recommendations = []

    if payload["features"] >= 55:
        drivers.append("Large feature scope is increasing cost and timeline.")
        recommendations.append("Split the scope into MVP and phase-2 modules.")
    if payload["integrations"] >= 8:
        drivers.append("Multiple external integrations add testing and coordination risk.")
        recommendations.append("Prototype critical integrations before full development.")
    if payload["requirements_volatility"] >= 35:
        drivers.append("High requirement volatility is reducing success probability.")
        recommendations.append("Freeze baseline requirements and use weekly change-control review.")
    if payload["team_velocity"] < 24:
        drivers.append("Low team velocity is stretching the completion timeline.")
        recommendations.append("Reduce WIP, assign senior reviewers, and track sprint velocity.")
    if payload["team_experience"] < 4:
        drivers.append("Lower team experience increases delivery uncertainty.")
        recommendations.append("Add one senior engineer or architect for mentoring and design review.")
    if payload["security_level"] >= 4:
        drivers.append("High security level increases design, review and testing effort.")
        recommendations.append("Schedule security testing and threat modelling early.")
    if payload["reuse_percent"] < 15:
        drivers.append("Low component reuse keeps implementation effort high.")
        recommendations.append("Reuse existing templates, libraries and internal modules where possible.")
    if payload["complexity"] in ["High", "Critical"]:
        drivers.append(f"{payload['complexity']} complexity requires stronger planning buffers.")
        recommendations.append("Add contingency buffer on the critical path and monitor blockers daily.")

    if not drivers:
        drivers.append("Project inputs are balanced, with no extreme cost or risk driver.")
    if not recommendations:
        recommendations.append("Continue with the current plan and monitor timeline variance weekly.")

    return {
        "summary": f"Estimated as {risk_level} risk with about {round(float(success), 1)}% success probability.",
        "topDrivers": drivers[:5],
        "recommendations": recommendations[:5],
        "whatIf": [
            "Reducing requirement volatility by 10-15% can improve risk and success score.",
            "Increasing reuse percentage can reduce cost for repeated modules.",
            "Improving team velocity has the strongest direct impact on timeline.",
        ],
        "confidence": "High" if risk_score < 45 and len(drivers) <= 3 else "Medium" if risk_score < 65 else "Needs review",
    }
