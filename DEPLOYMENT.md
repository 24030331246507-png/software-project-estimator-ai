# Deployment Guide

This project can be hosted with:

- Frontend: Vercel or Netlify
- Backend: Render, Railway or any Python hosting platform
- Database: SQLite for demo hosting, MySQL for final production submission

## 1. Prepare Backend

The backend exposes a production WSGI entry point:

```bash
gunicorn wsgi:app
```

Required environment variables:

```env
FLASK_DEBUG=false
DATABASE_URL=sqlite:///dev.db
FRONTEND_URLS=https://your-frontend-domain.vercel.app
SECRET_KEY=change-this-secret
JWT_SECRET_KEY=change-this-jwt-secret
```

For MySQL hosting:

```env
DATABASE_URL=mysql+pymysql://user:password@host:3306/project_estimator
```

## 2. Deploy Backend On Render

1. Push this project to GitHub.
2. Open Render and create a new Web Service.
3. Select the repository.
4. Use these settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: gunicorn wsgi:app
```

5. Add the environment variables listed above.
6. Copy the deployed backend URL, for example:

```text
https://cost-time-project-analysis-api.onrender.com
```

## 3. Deploy Frontend On Vercel

1. Open Vercel and import the same GitHub repository.
2. Set root directory to `frontend`.
3. Build command:

```bash
npm run build
```

4. Output directory:

```text
dist
```

5. Add this environment variable:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

6. Redeploy the frontend after saving the variable.

## 4. Connect Frontend And Backend

After frontend deployment, copy the Vercel URL and update backend `FRONTEND_URLS`:

```env
FRONTEND_URLS=https://your-frontend-domain.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Redeploy the backend.

## 5. Demo Flow

1. Register a user.
2. Create a prediction with project attributes and task owners.
3. Show PERT, CPM and Gantt chart output.
4. Open Dashboard to show history, Problem Center and Team Profiles.
5. Download the PDF report.
6. Explain deployment using Vercel frontend plus Render backend.
