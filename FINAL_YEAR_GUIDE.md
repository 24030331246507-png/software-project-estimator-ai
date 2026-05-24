# Project Completion Guide

Project name: Cost & Time Project Analysis

This guide is for completing, improving and presenting the project until final submission.

## 1. How To Request Changes

When you want any change, write it in this format:

```text
Page: Prediction
Change: Add INR/USD currency option
Reason: Report should show cost in Indian rupees for college demo
Screenshot/Error: attach screenshot if available
```

Good examples:

- Page: Dashboard. Change: Add status filter for completed, blocked and in-progress tasks.
- Page: Report. Change: Add PERT/CPM summary and team owner table in PDF.
- Page: Home. Change: Make hero section more professional and real-time problem focused.
- Backend: Add project update API so task progress can be changed after prediction.
- Hosting: Fix CORS or API URL issue after deploying.

## 2. Major Project Feature Checklist

Core features:

- User registration and login
- Project-based authentication with shared project access code
- Project cost prediction
- Project timeline prediction
- Risk level and success probability
- Recommended team size
- Prediction history
- PDF report download
- Actual vs predicted cost, timeline and progress variance tracker

Planning features:

- PERT expected time
- CPM critical path
- Slack calculation
- P80 and P95 safer duration
- Interactive Gantt chart
- Delay simulation
- Optimizer for safer planning inputs
- Variance charts for planned cost/time compared with actual execution

Management features:

- Task owner, role, status and progress
- Team profile view
- Problem Center for risk/action plans
- Portfolio trend charts
- Admin dashboard
- CSV model retraining

Hosting features:

- Frontend ready for Vercel
- Backend ready for Render
- Environment variable examples
- Deployment guide

## 3. Real-Time Problem Statement

Many software projects fail because early estimates are inaccurate, requirement changes are not tracked, task ownership is unclear and critical-path delays are discovered too late.

This system solves that problem by combining project estimation, task planning, critical-path analysis, risk monitoring, team accountability and report generation in one dashboard.

## 4. Demo Flow For Viva

1. Open Home page and explain the real-time project management problem.
2. Register or login.
3. Go to Prediction page.
4. Enter project details such as features, integrations, complexity, team velocity and volatility.
5. Add tasks with optimistic, most-likely and pessimistic time.
6. Assign task owners, roles, status and progress.
7. Run prediction.
8. Explain cost, timeline, risk, success probability and team size.
9. Show PERT, CPM and Gantt chart.
10. Open Dashboard.
11. Show history, Problem Center, Team Profiles and PDF report download.
12. Explain hosting using Vercel frontend and Render backend.

## 5. How To Run Locally

Backend:

```powershell
cd C:\Users\User\Desktop\P\software-project-estimator-ai\backend
python run.py
```

Frontend:

```powershell
cd C:\Users\User\Desktop\P\software-project-estimator-ai\frontend
npm run dev
```

If PowerShell blocks npm:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

Open:

```text
http://127.0.0.1:5173
```

## 6. Hosting Plan

Backend:

- Platform: Render
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn wsgi:app`

Frontend:

- Platform: Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend-url/api`

After frontend deployment, update backend:

```env
FRONTEND_URLS=https://your-frontend-url.vercel.app
```

## 7. Final Submission Checklist

Before submission:

- Run backend without errors.
- Run frontend without blank screen.
- Register and login successfully.
- Create at least one prediction.
- Check Dashboard history.
- Download PDF report.
- Capture screenshots of Home, Prediction, Result, Dashboard and Report.
- Keep `README.md`, `DEPLOYMENT.md` and this guide in the project folder.
- Prepare PPT using the demo flow above.

## 8. Suggested Next Improvements

These are good major-level upgrades if more time is available:

- Edit task progress after prediction.
- Add project status filter in Dashboard.
- Add PDF section for team ownership and critical path.
- Add email export or shareable report link.
- Add MySQL cloud database for hosted production.
- Add role-based access: admin, manager, viewer.
- Add project comparison page for multiple estimates.
