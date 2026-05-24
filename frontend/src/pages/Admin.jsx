import React, { useEffect, useState } from "react";
import { admin, predictions } from "../services/api.js";
import MetricCard from "../components/MetricCard.jsx";

const adminHelp = [
  ["System Overview", "Total users, total predictions, contact messages and average project success."],
  ["Model Training", "Retrain the prediction model with demo data or upload a CSV dataset."],
  ["Contact Queries", "Messages sent from Contact page are stored here for admin review."],
  ["Recent Predictions", "Latest project predictions with risk, timeline and report reference."],
];

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [dataset, setDataset] = useState(null);
  useEffect(() => {
    admin.summary().then(({ data }) => setSummary(data)).catch(() => setMessage("Admin access is available to the first registered user."));
  }, []);
  const retrain = async () => {
    const { data } = await predictions.train();
    setMessage(`Model retrained. RF R2: ${data.metrics.rfR2.toFixed(3)}, MLP R2: ${data.metrics.mlpR2.toFixed(3)}`);
  };
  const uploadDataset = async () => {
    if (!dataset) {
      setMessage("Please select a CSV dataset first.");
      return;
    }
    const { data } = await predictions.trainUpload(dataset);
    setMessage(`CSV model trained with ${data.metrics.rows} rows. RF R2: ${data.metrics.rfR2.toFixed(3)}, MLP R2: ${data.metrics.mlpR2.toFixed(3)}`);
  };
  return (
    <div className="page">
      <div className="section-title">
        <h1>Admin Dashboard</h1>
        <p>Admin can monitor system usage, contact queries, recent predictions and model training.</p>
      </div>
      {message && <p className="notice">{message}</p>}

      <div className="admin-help-grid">
        {adminHelp.map(([title, text]) => (
          <div className="panel admin-help-card" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </div>

      {summary && (
        <section className="admin-section">
          <div className="section-title compact">
            <h2>System Overview</h2>
            <p>Quick numbers for project usage and demo explanation.</p>
          </div>
          <div className="result-grid">
            <MetricCard title="Users" value={summary.users} accent="#22d3ee" />
            <MetricCard title="Predictions" value={summary.predictions} accent="#a3e635" />
            <MetricCard title="Contact Queries" value={summary.contactQueries || 0} accent="#14b8a6" />
            <MetricCard title="Avg Success" value={`${summary.averageSuccess}%`} accent="#fb7185" />
          </div>
        </section>
      )}

      <section className="panel admin-train-panel">
        <div>
          <h2>Model Training Controls</h2>
          <p>Use this only when you want to retrain the cost and timeline prediction model.</p>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={retrain}>Retrain Demo Model</button>
          <label className="file-box">Upload CSV Dataset
            <input type="file" accept=".csv" onChange={(event) => setDataset(event.target.files?.[0] || null)} />
          </label>
          <button className="btn ghost" onClick={uploadDataset}>Train From CSV</button>
        </div>
        <p className="admin-note">CSV training is useful when you collect your own software project estimation dataset.</p>
      </section>

      {summary?.recentContactQueries?.length > 0 && (
        <div className="panel table-wrap">
          <h2>Contact Queries</h2>
          <p className="table-note">These messages come from the Contact page form.</p>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Message</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{summary.recentContactQueries.map((query) => (
              <tr key={query.id}>
                <td>{query.name}</td>
                <td>{query.email}</td>
                <td>{query.queryType}</td>
                <td>{query.message}</td>
                <td>{query.status}</td>
                <td>{new Date(query.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {summary?.recent?.length > 0 && (
        <div className="panel table-wrap">
          <h2>Recent Predictions</h2>
          <p className="table-note">Latest projects created by users.</p>
          <table>
            <thead><tr><th>Project ID</th><th>Project</th><th>Risk</th><th>Cost</th><th>Timeline</th><th>Success</th><th>Created</th></tr></thead>
            <tbody>{summary.recent.map((project) => (
              <tr key={project.id}>
                <td>{project.projectId || project.result.projectId}</td>
                <td>{project.projectName}</td>
                <td>{project.result.riskLevel}</td>
                <td>${Math.round(project.result.costUsd).toLocaleString()}</td>
                <td>{project.result.timelineWeeks}w</td>
                <td>{project.result.successProbability}%</td>
                <td>{new Date(project.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
