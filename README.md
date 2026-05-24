# Cost & Time Project Analysis

An industry-style project for model-based software cost and timeline analysis with a React dashboard, Flask REST API, MySQL persistence, JWT authentication, ML prediction, PERT/CPM planning, Gantt visualization, history tracking, admin analytics and PDF reports.

## Features

- Predict project cost, completion timeline, risk level, team size and success probability.
- Random Forest Regression model saved with pickle.
- MLP neural regressor blended with Random Forest for nonlinear deep-learning-style analysis.
- PERT expected duration, CPM critical path and interactive Gantt view.
- Advanced PERT/CPM with variance, standard deviation, P80/P95 duration, slack and schedule risk alerts.
- Real-time infrastructure factors: weather, material cost index, vendor reliability, regulatory delay and right-of-way risk.
- Interactive task builder for PERT/CPM instead of manual JSON editing.
- Explainable insights with top drivers, recommendations, what-if analysis and confidence.
- Unique project access code for sharing project access securely.
- Project health score with alerts for real-time monitoring.
- Problem Center for real-time problem statements, root cause and action plans.
- Task ownership tracking with assignee, role, status, progress and blocked-task alerts.
- Actual vs predicted variance tracker for cost, timeline and progress monitoring.
- Delay simulation for task slips and critical-path impact.
- Optimizer that suggests safer cost/timeline/risk inputs.
- CSV dataset upload and model retraining from the Admin dashboard.
- Authentication for users and projects with JWT.
- MySQL database through SQLAlchemy and PyMySQL.
- Dashboard charts, admin summary, model retraining endpoint and PDF report generation.
- Host-ready setup with WSGI, Gunicorn, Render backend config and Vercel frontend routing.

## Project Structure

```text
software-project-estimator-ai/
  backend/
    app/
      models/
      routes/
      services/
    data/
    ml/
    reports/
    requirements.txt
    run.py
  frontend/
    src/
      components/
      pages/
      services/
      styles/
    package.json
  DEPLOYMENT.md
  FINAL_YEAR_GUIDE.md
  render.yaml
  Procfile
```

## Backend Installation

1. Install Python dependencies:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

The default `.env.example` uses SQLite so the project runs immediately on any laptop:

```env
DATABASE_URL=sqlite:///dev.db
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173
```

2. Train the ML model:

```powershell
python ml/train_model.py
```

3. Run the API:

```powershell
python run.py
```

The backend runs on `http://127.0.0.1:5000`.

## MySQL Mode

For final submission or deployment with MySQL, make sure the MySQL service is running, then create the database:

```sql
CREATE DATABASE project_estimator;
```

Copy the MySQL example and update the password:

```powershell
copy .env.mysql.example .env
```

```env
DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/project_estimator
```

## Frontend Installation

```bash
cd frontend
npm install
npm run dev
```

The React app runs on `http://127.0.0.1:5173`.

## Usage

1. Register a new account. The first registered user becomes admin.
2. Open Prediction and enter project attributes.
3. Edit the PERT task JSON to match your real project plan.
4. Run prediction to see estimates, success probability and the Gantt chart.
5. Download the PDF report from the result page.
6. Use Dashboard for history and Admin for usage summary or model retraining.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/predict`
- `GET /api/history`
- `GET /api/problems`
- `POST /api/pert-cpm`
- `GET /api/reports/<prediction_id>`
- `POST /api/train`
- `POST /api/train/upload`
- `POST /api/projects/join`
- `POST /api/projects/<prediction_id>/simulate-delay`
- `POST /api/projects/<prediction_id>/optimize`
- `GET /api/admin/summary`

## Notes for Viva or Final Review

The bundled CSV is a small sample for demonstration, while the training script generates a larger synthetic software-estimation dataset to make the application runnable without paid or private datasets. For research submission, replace or append a real COCOMO, ISBSG-style, or organization-specific dataset and retrain the pickle model.

Use `FINAL_YEAR_GUIDE.md` for the final submission checklist, viva demo flow, change request format and project completion roadmap.

## Hosting

Use `DEPLOYMENT.md` for the complete hosting guide. Recommended deployment:

- Backend on Render with `gunicorn wsgi:app`
- Frontend on Vercel with `VITE_API_URL` pointing to the backend `/api`
- SQLite for demo hosting or MySQL for final production mode

## Requirement Alignment

This project aligns with the "Predicting Project Costs and Timeline" requirement by adding multi-source risk factors such as weather risk, material cost index, vendor reliability, regulatory delay and right-of-way risk. The Problem Center converts these factors into real-time problem statements, root causes and action plans for proactive project management.
