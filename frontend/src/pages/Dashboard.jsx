import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "../components/Sidebar.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Loading from "../components/Loading.jsx";
import { predictions } from "../services/api.js";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Predictions");
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [problemFeed, setProblemFeed] = useState(null);
  const [taskEdits, setTaskEdits] = useState({});
  const [taskMessage, setTaskMessage] = useState("");
  const [actualEdits, setActualEdits] = useState({});
  const [actualMessage, setActualMessage] = useState("");
  useEffect(() => {
    Promise.all([predictions.history(), predictions.problems()])
      .then(([historyResponse, problemResponse]) => {
        setHistory(historyResponse.data);
        setProblemFeed(problemResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);
  const refreshHistory = () => predictions.history().then(({ data }) => setHistory(data));
  const refreshProblems = () => predictions.problems().then(({ data }) => setProblemFeed(data));
  const joinProject = async () => {
    try {
      const { data } = await predictions.joinProject(joinCode);
      setJoinMessage(data.message);
      setJoinCode("");
      refreshHistory();
      refreshProblems();
    } catch (err) {
      setJoinMessage(err.response?.data?.message || "Could not join project.");
    }
  };
  const stats = useMemo(() => {
    const count = history.length || 1;
    return {
      projects: history.length,
      avgCost: history.reduce((sum, p) => sum + p.result.costUsd, 0) / count,
      avgWeeks: history.reduce((sum, p) => sum + p.result.timelineWeeks, 0) / count,
      avgSuccess: history.reduce((sum, p) => sum + p.result.successProbability, 0) / count,
    };
  }, [history]);
  const chartData = history.slice().reverse().map((p) => ({
    name: p.projectName.slice(0, 12),
    cost: Math.round(p.result.costUsd / 1000),
    weeks: p.result.timelineWeeks,
    success: p.result.successProbability,
  }));
  const riskData = useMemo(() => {
    const colors = { Low: "#a3e635", Medium: "#fbbf24", High: "#fb7185", Critical: "#ef4444" };
    const counts = history.reduce((acc, project) => {
      const risk = project.result.riskLevel || "Unknown";
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: colors[name] || "#22d3ee" }));
  }, [history]);
  const latestMetrics = history[0]?.result?.modelMetrics;
  const varianceRows = useMemo(() => history.map((project) => {
    const tasks = project.pert?.tasks || [];
    const plannedProgress = tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / tasks.length)
      : 0;
    const actuals = project.result?.actuals || {};
    const variance = project.result?.variance || {};
    return {
      projectId: project.id,
      visibleProjectId: project.projectId || project.result?.projectId || `CTPA-${project.id}`,
      projectName: project.projectName,
      predictedCost: Number(project.result.costUsd || 0),
      predictedTimeline: Number(project.result.timelineWeeks || 0),
      plannedProgress,
      actualCost: actuals.actualCostUsd ?? "",
      actualTimeline: actuals.actualTimelineWeeks ?? "",
      actualProgress: actuals.actualProgressPercent ?? "",
      notes: actuals.notes || "",
      variance,
    };
  }), [history]);
  useEffect(() => {
    const nextEdits = {};
    varianceRows.forEach((project) => {
      nextEdits[project.projectId] = {
        actualCostUsd: project.actualCost,
        actualTimelineWeeks: project.actualTimeline,
        actualProgressPercent: project.actualProgress,
        notes: project.notes,
      };
    });
    setActualEdits(nextEdits);
  }, [varianceRows]);
  const updateActualEdit = (project, key, value) => {
    setActualEdits({
      ...actualEdits,
      [project.projectId]: {
        ...actualEdits[project.projectId],
        [key]: ["actualCostUsd", "actualTimelineWeeks", "actualProgressPercent"].includes(key) ? Number(value) : value,
      },
    });
  };
  const saveActuals = async (project) => {
    try {
      await predictions.updateActuals(project.projectId, actualEdits[project.projectId]);
      setActualMessage(`${project.projectName} actual progress saved.`);
      await refreshHistory();
      await refreshProblems();
    } catch (err) {
      setActualMessage(err.response?.data?.message || "Actual progress update failed.");
    }
  };
  const ownershipRows = useMemo(() => history.flatMap((project) => (
    (project.pert?.tasks || []).map((task) => ({
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.result?.projectCode || "N/A",
      visibleProjectId: project.projectId || project.result?.projectId || `CTPA-${project.id}`,
      taskId: task.id,
      taskName: task.name,
      assignedTo: task.assignedTo || "Unassigned",
      role: task.role || "Team",
      status: task.status || "Pending",
      progress: Number(task.progress || 0),
      critical: Boolean(task.critical),
    }))
  )), [history]);
  useEffect(() => {
    const nextEdits = {};
    ownershipRows.forEach((task) => {
      nextEdits[`${task.projectId}-${task.taskId}`] = {
        assignedTo: task.assignedTo,
        role: task.role,
        status: task.status,
        progress: task.progress,
      };
    });
    setTaskEdits(nextEdits);
  }, [ownershipRows]);
  const updateTaskEdit = (task, key, value) => {
    const editKey = `${task.projectId}-${task.taskId}`;
    setTaskEdits({
      ...taskEdits,
      [editKey]: {
        ...taskEdits[editKey],
        [key]: key === "progress" ? Number(value) : value,
      },
    });
  };
  const saveTaskUpdate = async (task) => {
    const editKey = `${task.projectId}-${task.taskId}`;
    try {
      await predictions.updateTask(task.projectId, task.taskId, taskEdits[editKey]);
      setTaskMessage(`${task.taskName} updated successfully.`);
      await refreshHistory();
      await refreshProblems();
    } catch (err) {
      setTaskMessage(err.response?.data?.message || "Task update failed.");
    }
  };
  const ownerProfiles = useMemo(() => {
    const profileMap = ownershipRows.reduce((acc, task) => {
      const key = task.assignedTo || "Unassigned";
      if (!acc[key]) {
        acc[key] = {
          name: key,
          roles: new Set(),
          tasks: [],
          completed: 0,
          inProgress: 0,
          blocked: 0,
          critical: 0,
          progressTotal: 0,
        };
      }
      acc[key].roles.add(task.role);
      acc[key].tasks.push(task);
      acc[key].progressTotal += task.progress;
      if (task.status === "Completed") acc[key].completed += 1;
      if (task.status === "In Progress") acc[key].inProgress += 1;
      if (task.status === "Blocked") acc[key].blocked += 1;
      if (task.critical) acc[key].critical += 1;
      return acc;
    }, {});
    return Object.values(profileMap).map((profile) => ({
      ...profile,
      roles: Array.from(profile.roles).filter(Boolean).join(", ") || "N/A",
      avgProgress: profile.tasks.length ? Math.round(profile.progressTotal / profile.tasks.length) : 0,
      initials: profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "NA",
    }));
  }, [ownershipRows]);

  const emptyState = (
    <div className="panel empty-state">
      <h2>No predictions yet</h2>
      <p>Create a prediction first, then this dashboard will show your project analytics.</p>
    </div>
  );

  const renderTab = () => {
    if (!history.length) return emptyState;

    if (activeTab === "Task Ownership") {
      const blocked = ownershipRows.filter((task) => task.status === "Blocked").length;
      const active = ownershipRows.filter((task) => task.status === "In Progress").length;
      const completed = ownershipRows.filter((task) => task.status === "Completed").length;
      return (
        <div className="ownership-view">
          <div className="result-grid">
            <MetricCard title="Tracked Tasks" value={ownershipRows.length} accent="#0ea5e9" />
            <MetricCard title="In Progress" value={active} accent="#10b981" />
            <MetricCard title="Blocked" value={blocked} accent="#e11d48" />
            <MetricCard title="Completed" value={completed} accent="#f59e0b" />
          </div>
          <div className="profile-grid compact">
            {ownerProfiles.slice(0, 4).map((profile) => (
              <div className="panel user-profile-card" key={profile.name}>
                <div className="avatar">{profile.initials}</div>
                <div>
                  <h3>{profile.name}</h3>
                  <p>{profile.roles}</p>
                  <small>{profile.tasks.length} tasks / {profile.avgProgress}% average progress</small>
                </div>
              </div>
            ))}
          </div>
          <div className="panel table-wrap">
            <h2>Who Is Doing What?</h2>
            {taskMessage && <p className="notice">{taskMessage}</p>}
            <table>
              <thead><tr><th>Project ID</th><th>Project</th><th>Task</th><th>Owner</th><th>Role</th><th>Status</th><th>Progress</th><th>Critical</th><th>Save</th></tr></thead>
              <tbody>{ownershipRows.map((task) => {
                const editKey = `${task.projectId}-${task.taskId}`;
                const edit = taskEdits[editKey] || task;
                return (
                <tr key={`${task.projectId}-${task.taskId}`}>
                  <td>{task.visibleProjectId}</td>
                  <td>{task.projectName}</td>
                  <td>{task.taskId} - {task.taskName}</td>
                  <td><input className="table-input" value={edit.assignedTo} onChange={(e) => updateTaskEdit(task, "assignedTo", e.target.value)} /></td>
                  <td>
                    <select className="table-input" value={edit.role} onChange={(e) => updateTaskEdit(task, "role", e.target.value)}>
                      {["Project Manager", "Architect", "Developer", "Tester", "Designer", "DevOps", "Analyst", "Team"].map((role) => <option key={role}>{role}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="table-input" value={edit.status} onChange={(e) => updateTaskEdit(task, "status", e.target.value)}>
                      {["Pending", "In Progress", "Completed", "Blocked"].map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td><input className="table-input small-field" type="number" min="0" max="100" value={edit.progress} onChange={(e) => updateTaskEdit(task, "progress", e.target.value)} />%</td>
                  <td>{task.critical ? "Yes" : "No"}</td>
                  <td><button className="table-action" type="button" onClick={() => saveTaskUpdate(task)}>Save</button></td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === "Team Profiles") {
      return (
        <div className="profile-grid">
          {ownerProfiles.map((profile) => (
            <div className="panel profile-card" key={profile.name}>
              <div className="profile-head">
                <div className="avatar large">{profile.initials}</div>
                <div>
                  <h2>{profile.name}</h2>
                  <p>{profile.roles}</p>
                </div>
              </div>
              <div className="profile-stats">
                <span><strong>{profile.tasks.length}</strong>Tasks</span>
                <span><strong>{profile.completed}</strong>Done</span>
                <span><strong>{profile.inProgress}</strong>Active</span>
                <span><strong>{profile.blocked}</strong>Blocked</span>
              </div>
              <div className="progress-track">
                <div style={{ width: `${profile.avgProgress}%` }} />
              </div>
              <p className="profile-note">{profile.critical} critical-path task(s) assigned.</p>
              <div className="profile-task-list">
                {profile.tasks.slice(0, 4).map((task) => (
                  <span key={`${task.projectName}-${task.taskId}`}>{task.taskId} - {task.taskName} ({task.status})</span>
                ))}
              </div>
            </div>
          ))}
          {!ownerProfiles.length && (
            <div className="panel empty-state">
              <h2>No team profiles yet</h2>
              <p>Create a prediction with task owners to generate profiles.</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "Variance Tracker") {
      const tracked = varianceRows.filter((project) => project.variance?.actualCostUsd !== undefined || project.variance?.actualTimelineWeeks !== undefined || project.variance?.actualProgressPercent !== undefined);
      const needsAttention = varianceRows.filter((project) => project.variance?.status === "Needs Attention").length;
      const avgProgress = varianceRows.length
        ? varianceRows.reduce((sum, project) => sum + Number(project.actualProgress || project.plannedProgress || 0), 0) / varianceRows.length
        : 0;
      const varianceChart = varianceRows.map((project) => ({
        name: project.projectName.slice(0, 12),
        predictedCost: Math.round(project.predictedCost / 1000),
        actualCost: project.actualCost === "" ? 0 : Math.round(Number(project.actualCost) / 1000),
        predictedWeeks: project.predictedTimeline,
        actualWeeks: project.actualTimeline === "" ? 0 : Number(project.actualTimeline),
      }));
      return (
        <div className="ownership-view">
          <div className="result-grid">
            <MetricCard title="Tracked Actuals" value={tracked.length} accent="#0ea5e9" />
            <MetricCard title="Needs Attention" value={needsAttention} accent="#e11d48" />
            <MetricCard title="Avg Actual Progress" value={`${avgProgress.toFixed(1)}%`} accent="#10b981" />
            <MetricCard title="Projects" value={varianceRows.length} accent="#f59e0b" />
          </div>
          <div className="charts-grid">
            <div className="panel">
              <h2>Cost Variance ($k)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={varianceChart}><CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="predictedCost" fill="#2563eb" name="Predicted" /><Bar dataKey="actualCost" fill="#14b8a6" name="Actual" /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="panel">
              <h2>Timeline Variance</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={varianceChart}><CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="predictedWeeks" stroke="#2563eb" strokeWidth={3} name="Predicted" /><Line type="monotone" dataKey="actualWeeks" stroke="#e11d48" strokeWidth={3} name="Actual" /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel table-wrap">
            <h2>Actual vs Predicted Tracker</h2>
            {actualMessage && <p className="notice">{actualMessage}</p>}
            <table>
              <thead><tr><th>Project ID</th><th>Project</th><th>Predicted Cost</th><th>Actual Cost</th><th>Cost Var</th><th>Predicted Weeks</th><th>Actual Weeks</th><th>Time Var</th><th>Progress</th><th>Status</th><th>Notes</th><th>Save</th></tr></thead>
              <tbody>{varianceRows.map((project) => {
                const edit = actualEdits[project.projectId] || {};
                const variance = project.variance || {};
                return (
                  <tr key={project.projectId}>
                    <td>{project.visibleProjectId}</td>
                    <td>{project.projectName}</td>
                    <td>${Math.round(project.predictedCost).toLocaleString()}</td>
                    <td><input className="table-input" type="number" value={edit.actualCostUsd} onChange={(e) => updateActualEdit(project, "actualCostUsd", e.target.value)} /></td>
                    <td>{variance.costVarianceUsd == null ? "N/A" : `$${Math.round(variance.costVarianceUsd).toLocaleString()} (${variance.costVariancePercent}%)`}</td>
                    <td>{project.predictedTimeline}w</td>
                    <td><input className="table-input small-field" type="number" value={edit.actualTimelineWeeks} onChange={(e) => updateActualEdit(project, "actualTimelineWeeks", e.target.value)} />w</td>
                    <td>{variance.timelineVarianceWeeks == null ? "N/A" : `${variance.timelineVarianceWeeks}w (${variance.timelineVariancePercent}%)`}</td>
                    <td><input className="table-input small-field" type="number" min="0" max="100" value={edit.actualProgressPercent} onChange={(e) => updateActualEdit(project, "actualProgressPercent", e.target.value)} />%</td>
                    <td><span className={variance.status === "Needs Attention" ? "status-pill blocked" : "status-pill completed"}>{variance.status || "Not tracked"}</span></td>
                    <td><input className="table-input" value={edit.notes} onChange={(e) => updateActualEdit(project, "notes", e.target.value)} placeholder="Update note" /></td>
                    <td><button className="table-action" type="button" onClick={() => saveActuals(project)}>Save</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === "Problem Center") {
      return (
        <div className="problem-center">
          <div className="result-grid">
            <MetricCard title="Open Problems" value={problemFeed?.count || 0} accent="#0ea5e9" />
            <MetricCard title="Critical" value={problemFeed?.critical || 0} accent="#e11d48" />
            <MetricCard title="High" value={problemFeed?.high || 0} accent="#f59e0b" />
            <MetricCard title="Medium" value={problemFeed?.medium || 0} accent="#10b981" />
          </div>
          <div className="problem-toolbar">
            <h2>Problem Center</h2>
            <button className="btn ghost" type="button" onClick={refreshProblems}>Refresh Live Feed</button>
          </div>
          {problemFeed?.problems?.length ? problemFeed.problems.map((problem) => (
            <div className={`panel problem-card ${problem.severity.toLowerCase()}`} key={`${problem.projectId}-${problem.type}`}>
              <div className="problem-head">
                <span>{problem.severity}</span>
                <strong>{problem.type}</strong>
                <small>{problem.projectName} / {problem.projectCode}</small>
              </div>
              <h3>{problem.statement}</h3>
              <p><strong>Root cause:</strong> {problem.rootCause}</p>
              <p><strong>Expected impact:</strong> {problem.expectedImpact}</p>
              <ul>{problem.actionPlan.map((action) => <li key={action}>{action}</li>)}</ul>
            </div>
          )) : (
            <div className="panel empty-state">
              <h2>No active project problems</h2>
              <p>All tracked projects are currently in the safe zone.</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "Risk Analytics") {
      return (
        <div className="charts-grid">
          <div className="panel">
            <h2>Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={105} label>
                  {riskData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="panel table-wrap">
            <h2>Risk Details</h2>
            <table><thead><tr><th>Risk</th><th>Projects</th></tr></thead><tbody>{riskData.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.value}</td></tr>)}</tbody></table>
          </div>
        </div>
      );
    }

    if (activeTab === "Model Metrics") {
      return (
        <div className="result-grid">
          <MetricCard title="Random Forest R2" value={latestMetrics ? latestMetrics.rfR2.toFixed(3) : "N/A"} accent="#22d3ee" />
          <MetricCard title="MLP R2" value={latestMetrics ? latestMetrics.mlpR2.toFixed(3) : "N/A"} accent="#a3e635" />
          <MetricCard title="Prediction Records" value={history.length} accent="#fbbf24" />
          <MetricCard title="Avg Success" value={`${stats.avgSuccess.toFixed(1)}%`} accent="#fb7185" />
        </div>
      );
    }

    if (activeTab === "Portfolio Trends") {
      return (
        <div className="charts-grid">
          <div className="panel">
            <h2>Cost and Timeline</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}><CartesianGrid stroke="#263244" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="cost" fill="#22d3ee" name="Cost $k" /><Bar dataKey="weeks" fill="#a3e635" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="panel">
            <h2>Success Trend</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}><CartesianGrid stroke="#263244" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="success" stroke="#fbbf24" strokeWidth={3} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return (
      <div className="panel table-wrap">
        <h2>History Tracking</h2>
        <table><thead><tr><th>Project ID</th><th>Project</th><th>Join Code</th><th>Cost</th><th>Timeline</th><th>Risk</th><th>Success</th><th>Report</th></tr></thead><tbody>{history.map((p) => <tr key={p.id}><td>{p.projectId || p.result.projectId}</td><td>{p.projectName}</td><td>{p.result.projectCode}</td><td>${Math.round(p.result.costUsd).toLocaleString()}</td><td>{p.result.timelineWeeks}w</td><td>{p.result.riskLevel}</td><td>{p.result.successProbability}%</td><td><button className="table-action" type="button" onClick={() => predictions.downloadReport(p.id, p.projectName)}>PDF</button></td></tr>)}</tbody></table>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <section className="dashboard-main">
        <div className="section-title">
          <h1>Dashboard</h1>
          <p>Prediction history, portfolio trends and model-backed planning signals.</p>
        </div>
        <div className="panel join-project">
          <div>
            <h2>Join Project</h2>
            <p>Use the Project Access Code shown after prediction or in the History table. Another user can share that code with you.</p>
          </div>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="PRJ-ABC123" />
          <button className="btn ghost" type="button" onClick={joinProject}>Join</button>
          {joinMessage && <span>{joinMessage}</span>}
        </div>
        {loading ? <Loading label="Loading dashboard" /> : (
          <>
            <div className="result-grid">
              <MetricCard title="Projects" value={stats.projects} accent="#22d3ee" />
              <MetricCard title="Avg Cost" value={`$${Math.round(stats.avgCost).toLocaleString()}`} accent="#a3e635" />
              <MetricCard title="Avg Timeline" value={`${stats.avgWeeks.toFixed(1)}w`} accent="#fbbf24" />
              <MetricCard title="Avg Success" value={`${stats.avgSuccess.toFixed(1)}%`} accent="#fb7185" />
            </div>
            <div className="tab-content">{renderTab()}</div>
          </>
        )}
      </section>
    </div>
  );
}
