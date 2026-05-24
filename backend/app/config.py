import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "local-development-secret-change-before-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "local-development-jwt-secret-change-before-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///dev.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_URLS = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_URLS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]
    REPORT_FOLDER = os.path.join(os.getcwd(), "reports")
    MODEL_PATH = os.path.join(os.getcwd(), "ml", "project_estimator.pkl")
