import React from "react";
import { BarChart3, Brain, Clock, Database, FileText, GitBranch, ShieldAlert, Users } from "lucide-react";

const capabilities = [
  ["Cost Forecasting", "Predicts estimated software or infrastructure project cost using Random Forest and neural regression.", BarChart3],
  ["Timeline Prediction", "Forecasts completion weeks and improves planning with PERT, CPM and Gantt analysis.", Clock],
  ["Real-Time Risk Factors", "Considers weather, material cost, vendor reliability, regulatory delay and right-of-way risk.", ShieldAlert],
  ["Task Ownership", "Tracks who is responsible for each task with role, status and progress percentage.", Users],
  ["Problem Center", "Detects real project issues and converts them into root causes and action plans.", Brain],
  ["PDF Reports", "Generates professional downloadable reports for project estimates and planning review.", FileText],
];

const workflow = [
  "Collect project scope, team and external risk inputs.",
  "Run ML prediction for cost, timeline, risk and success probability.",
  "Build PERT/CPM schedule and identify critical path and slack.",
  "Analyze real-time problems using health score and risk factors.",
  "Recommend optimized plan, team size and mitigation actions.",
];

export default function About() {
  return (
    <div className="page about-page">
      <section className="section-title about-top-title">
        <p className="eyebrow">About</p>
        <h1>Cost & Time Project Analysis</h1>
      </section>
      <section className="about-hero panel">
        <div>
          <p className="eyebrow">Project forecasting and planning platform</p>
          <h2>Project Overview</h2>
          <p>
            A project analysis system that predicts cost, completion timeline, risk level,
            team size and success probability, then converts those predictions into real-time planning
            actions using PERT, CPM, Gantt charts and a Problem Center.
          </p>
        </div>
        <div className="about-score">
          <strong>25192</strong>
          <span>Problem Statement</span>
          <small>Predicting Project Costs and Timeline</small>
        </div>
      </section>

      <section className="about-grid">
        <div className="panel about-block">
          <h2>Problem Statement</h2>
          <p>
            Project teams often face cost overruns, uncertain deadlines, weak task ownership and late
            risk detection. Traditional estimation depends heavily on intuition and past experience,
            so delays caused by scope changes, approvals, vendor issues and field constraints are
            detected too late.
          </p>
        </div>
        <div className="panel about-block">
          <h2>Our Solution</h2>
          <p>
            The platform combines machine learning, scheduling analytics and real-time risk indicators
            to forecast project outcomes and highlight practical corrective actions before execution
            problems become critical.
          </p>
        </div>
      </section>

      <section className="capability-grid">
        {capabilities.map(([title, text, Icon]) => (
          <div className="panel capability-card" key={title}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="about-grid">
        <div className="panel about-block">
          <h2>Technical Architecture</h2>
          <div className="tech-stack">
            <span>React</span>
            <span>Flask REST API</span>
            <span>SQLite / MySQL</span>
            <span>Random Forest</span>
            <span>MLP Regressor</span>
            <span>JWT Auth</span>
            <span>PDF Reports</span>
          </div>
        </div>
        <div className="panel about-block">
          <h2>Model Methodology</h2>
          <p>
            The model uses structured project attributes such as complexity, features, integrations,
            team experience, velocity, security level and reuse percentage. It blends Random Forest
            regression with an MLP neural regressor to estimate cost, timeline, team size and success
            probability.
          </p>
        </div>
      </section>

      <section className="panel about-process">
        <div>
          <h2>Workflow</h2>
          <p>From input collection to decision support, the system is designed for project managers who need quick and explainable planning decisions.</p>
        </div>
        <ol>
          {workflow.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </section>

      <section className="about-grid">
        <div className="panel about-block">
          <h2>Advanced PERT, CPM and Gantt</h2>
          <p>
            The planning engine calculates expected duration, variance, standard deviation, P80/P95
            durations, slack, critical path and schedule risk. Blocked or low-progress critical tasks
            are converted into problem alerts.
          </p>
        </div>
        <div className="panel about-block">
          <h2>Real-Time Factors</h2>
          <p>
            For infrastructure-style forecasting, the system includes weather risk, material cost index,
            vendor reliability, regulatory delay risk and right-of-way risk to estimate practical
            cost and timeline pressure.
          </p>
        </div>
      </section>

      <section className="panel about-impact">
        <div>
          <GitBranch size={26} />
          <h2>Impact</h2>
          <p>Improves planning accuracy, early risk detection, accountability and data-driven decision making.</p>
        </div>
        <div>
          <Database size={26} />
          <h2>Scalability</h2>
          <p>Can be extended for software, POWERGRID-style infrastructure, smart cities, highways and other public-sector projects.</p>
        </div>
      </section>
    </div>
  );
}
