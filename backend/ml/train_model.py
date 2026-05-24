from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app import create_app  # noqa: E402
from app.services.ml_service import train_and_save_model  # noqa: E402

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        model = train_and_save_model()
        print("Model saved.")
        print(model["metrics"])
