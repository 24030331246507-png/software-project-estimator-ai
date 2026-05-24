import React, { useState } from "react";
import { ResponsiveContainer, RadialBar, RadialBarChart, Tooltip } from "recharts";
import { predictions } from "../services/api.js";
import GanttChart from "../components/GanttChart.jsx";
import Loading from "../components/Loading.jsx";
import MetricCard from "../components/MetricCard.jsx";

const starterTasks = [
  { id: "A", name: "Requirements", optimistic: 1, mostLikely: 2, pessimistic: 3, dependencies: [], assignedTo: "Project Manager", role: "Project Manager", status: "In Progress", progress: 50 },
  { id: "B", name: "Architecture", optimistic: 1, mostLikely: 2, pessimistic: 4, dependencies: ["A"], assignedTo: "Senior Developer", role: "Architect", status: "Pending", progress: 0 },
  { id: "C", name: "Development", optimistic: 5, mostLikely: 8, pessimistic: 12, dependencies: ["B"], assignedTo: "Developer Team", role: "Developer", status: "Pending", progress: 0 },
  { id: "D", name: "Testing", optimistic: 2, mostLikely: 4, pessimistic: 6, dependencies: ["C"], assignedTo: "QA Engineer", role: "Tester", status: "Pending", progress: 0 },
  { id: "E", name: "Deployment", optimistic: 1, mostLikely: 1.5, pessimistic: 3, dependencies: ["D"], assignedTo: "DevOps Engineer", role: "DevOps", status: "Pending", progress: 0 },
];

export default function Prediction() {
  const [form, setForm] = useState({
    projectName: "",
    domain: "",
    methodology: "",
    complexity: "",
    features: "",
    integrations: "",
    teamExperience: "",
    teamVelocity: "",
    requirementsVolatility: "",
    securityLevel: "",
    reusePercent: "",
    estimatedKloc: "",
    weatherRisk: "",
    materialCostIndex: "",
    vendorReliability: "",
    regulatoryDelayRisk: "",
    rightOfWayRisk: "",
  });
  const [tasks, setTasks] = useState([]);
  const [result, setResult] = useState(null);
  const [delayForm, setDelayForm] = useState({ taskId: "C", delayWeeks: 1 });
  const [delayResult, setDelayResult] = useState(null);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm({ ...form, [key]: value });
  const loadDemoData = () => {
    setForm({
      projectName: "Smart Campus Management System",
      domain: "Enterprise",
      methodology: "Agile",
      complexity: "Medium",
      features: 32,
      integrations: 5,
      teamExperience: 6,
      teamVelocity: 30,
      requirementsVolatility: 24,
      securityLevel: 3,
      reusePercent: 18,
      estimatedKloc: 28,
      weatherRisk: 20,
      materialCostIndex: 100,
      vendorReliability: 75,
      regulatoryDelayRisk: 20,
      rightOfWayRisk: 20,
    });
    setTasks(starterTasks);
  };
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cleanedTasks = tasks.filter((task) => task.id || task.name);
      const invalidTask = cleanedTasks.find((task) => !task.id || !task.name || task.optimistic === "" || task.mostLikely === "" || task.pessimistic === "");
      if (invalidTask) {
        throw new Error("Please complete task ID, name and PERT time values, or remove the incomplete task.");
      }
      const { data } = await predictions.create({ ...form, tasks: cleanedTasks });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || err.message || "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };
  const updateTask = (index, key, value) => {
    setTasks(tasks.map((task, current) => {
      if (current !== index) return task;
      if (key === "dependencies") {
        return { ...task, dependencies: value.split(",").map((item) => item.trim()).filter(Boolean) };
      }
      return { ...task, [key]: value };
    }));
  };
  const addTask = () => {
    const nextId = String.fromCharCode(65 + tasks.length);
    setTasks([...tasks, { id: nextId, name: "", optimistic: "", mostLikely: "", pessimistic: "", dependencies: tasks.length ? [tasks[tasks.length - 1].id] : [], assignedTo: "", role: "Developer", status: "Pending", progress: 0 }]);
  };
  const removeTask = (index) => setTasks(tasks.filter((_, current) => current !== index));
  const runDelaySimulation = async () => {
    if (!result) return;
    const { data } = await predictions.simulateDelay(result.id, delayForm);
    setDelayResult(data);
  };
  const runOptimizer = async () => {
    if (!result) return;
    const { data } = await predictions.optimize(result.id);
    setOptimizerResult(data);
  };

  const chartData = result ? [{ name: "Success", value: result.result.successProbability, fill: "#22d3ee" }] : [];

  return (
    <div className="page split">
      <form className="panel prediction-form" onSubmit={submit}>
        <div className="section-title">
          <h1>Project Prediction</h1>
          <p>Enter your own project attributes and task estimates. Use demo data only when you want a quick sample.</p>
        </div>
        <input value={form.projectName} onChange={(e) => update("projectName", e.target.value)} placeholder="Project name" />
        <button className="btn ghost" type="button" onClick={loadDemoData}>Load Demo Data</button>
        <div className="form-grid">
          <select value={form.domain} onChange={(e) => update("domain", e.target.value)}>
            <option value="">Select domain</option>
            {["Enterprise", "FinTech", "Healthcare", "E-commerce", "Education", "Advanced Analytics"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select value={form.methodology} onChange={(e) => update("methodology", e.target.value)}>
            <option value="">Select methodology</option>
            {["Agile", "Scrum", "Waterfall", "Hybrid"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select value={form.complexity} onChange={(e) => update("complexity", e.target.value)}>
            <option value="">Select complexity</option>
            {["Low", "Medium", "High", "Critical"].map((v) => <option key={v}>{v}</option>)}
          </select>
          {["features", "integrations", "teamExperience", "teamVelocity", "requirementsVolatility", "securityLevel", "reusePercent", "estimatedKloc"].map((key) => (
            <label key={key}>{key.replace(/[A-Z]/g, " $&")}
              <input type="number" value={form[key]} onChange={(e) => update(key, e.target.value)} />
            </label>
          ))}
        </div>
        <div className="section-title compact">
          <h2>Real-Time External Factors</h2>
          <p>Use these for POWERGRID/infrastructure-style cost and timeline risk analysis.</p>
        </div>
        <div className="form-grid">
          {[
            ["weatherRisk", "Weather Risk %"],
            ["materialCostIndex", "Material Cost Index"],
            ["vendorReliability", "Vendor Reliability %"],
            ["regulatoryDelayRisk", "Regulatory Delay Risk %"],
            ["rightOfWayRisk", "Right-of-Way Risk %"],
          ].map(([key, label]) => (
            <label key={key}>{label}
              <input type="number" value={form[key]} onChange={(e) => update(key, e.target.value)} />
            </label>
          ))}
        </div>
        <div className="task-builder">
          <div className="section-title compact">
            <h2>PERT/CPM Task Builder</h2>
            <p>Add estimates, dependencies, owner, role, status and progress.</p>
          </div>
          <div className="task-row task-header">
            <span>ID</span>
            <span>Task</span>
            <span>Opt</span>
            <span>Likely</span>
            <span>Pess</span>
            <span>Deps</span>
            <span>Owner</span>
            <span>Role</span>
            <span>Status</span>
            <span>%</span>
            <span>Action</span>
          </div>
          {tasks.map((task, index) => (
            <div className="task-row" key={`${task.id}-${index}`}>
              <input value={task.id} onChange={(e) => updateTask(index, "id", e.target.value)} title="Task ID" />
              <input value={task.name} onChange={(e) => updateTask(index, "name", e.target.value)} title="Task name" />
              <input type="number" value={task.optimistic} onChange={(e) => updateTask(index, "optimistic", e.target.value)} title="Optimistic" />
              <input type="number" value={task.mostLikely} onChange={(e) => updateTask(index, "mostLikely", e.target.value)} title="Most likely" />
              <input type="number" value={task.pessimistic} onChange={(e) => updateTask(index, "pessimistic", e.target.value)} title="Pessimistic" />
              <input value={task.dependencies.join(",")} onChange={(e) => updateTask(index, "dependencies", e.target.value)} placeholder="Deps" title="Dependencies" />
              <input value={task.assignedTo} onChange={(e) => updateTask(index, "assignedTo", e.target.value)} placeholder="Assigned to" title="Assigned to" />
              <select value={task.role} onChange={(e) => updateTask(index, "role", e.target.value)} title="Role">
                {["Project Manager", "Architect", "Developer", "Tester", "Designer", "DevOps", "Analyst"].map((role) => <option key={role}>{role}</option>)}
              </select>
              <select value={task.status} onChange={(e) => updateTask(index, "status", e.target.value)} title="Status">
                {["Pending", "In Progress", "Completed", "Blocked"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <input type="number" min="0" max="100" value={task.progress} onChange={(e) => updateTask(index, "progress", e.target.value)} title="Progress percentage" />
              <button className="btn ghost" type="button" onClick={() => removeTask(index)}>Remove</button>
            </div>
          ))}
          {!tasks.length && <p className="empty-state">No default tasks added. Click Add Task to build your own PERT/CPM plan.</p>}
          <button className="btn ghost" type="button" onClick={addTask}>Add Task</button>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Run Prediction</button>
      </form>

      <section className="results-stack">
        {loading && <Loading />}
        {!loading && !result && (
          <div className="panel result-placeholder">
            <h2>Prediction Output</h2>
            <p>Click Run Prediction to generate cost, timeline, risk, team size, success probability, PERT/CPM, Gantt and recommendations.</p>
          </div>
        )}
        {result && (
          <>
            <div className="result-grid">
              <MetricCard title="Cost" value={`$${Math.round(result.result.costUsd).toLocaleString()}`} accent="#22d3ee" />
              <MetricCard title="Timeline" value={`${result.result.timelineWeeks} weeks`} accent="#a3e635" />
              <MetricCard title="Risk" value={result.result.riskLevel} accent="#fb7185" />
              <MetricCard title="Team" value={`${result.result.recommendedTeamSize} members`} accent="#fbbf24" />
            </div>
            <div className="panel project-access-card">
              <div>
                <h2>Project ID</h2>
                <p>{result.projectId || result.result.projectId}</p>
                <small>This is your visible project reference ID for tracking and viva explanation.</small>
              </div>
              <div>
                <h2>Project Access Code</h2>
                <p>{result.result.projectCode}</p>
                <small>Share this code with another logged-in user. They can paste it in Dashboard - Join Project.</small>
              </div>
              <div>
                <h2>Health Score</h2>
                <p>{result.result.health?.score}/100 - {result.result.health?.status}</p>
              </div>
              <ul>{result.result.health?.alerts?.map((alert) => <li key={alert}>{alert}</li>)}</ul>
            </div>
            <div className="panel chart-panel">
              <h2>Success Probability</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart innerRadius="65%" outerRadius="100%" data={chartData} startAngle={180} endAngle={-180}>
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <button className="btn ghost" type="button" onClick={() => predictions.downloadReport(result.id, result.projectName)}>Download PDF Report</button>
            </div>
            {result.result.realtimeFactors && (
              <div className="panel realtime-factors">
                <h2>Real-Time Risk Factor Impact</h2>
                <ul>{result.result.realtimeFactors.impactSummary.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            <GanttChart schedule={result.pert} />
            <div className="panel simulation-panel">
              <div className="section-title compact">
                <h2>Real-Time Delay Simulation</h2>
                <p>Enter a task ID and delay to see timeline, cost and risk impact.</p>
              </div>
              <div className="simulation-controls">
                <input value={delayForm.taskId} onChange={(e) => setDelayForm({ ...delayForm, taskId: e.target.value })} placeholder="Task ID" />
                <input type="number" value={delayForm.delayWeeks} onChange={(e) => setDelayForm({ ...delayForm, delayWeeks: Number(e.target.value) })} placeholder="Delay weeks" />
                <button className="btn ghost" type="button" onClick={runDelaySimulation}>Simulate Delay</button>
                <button className="btn" type="button" onClick={runOptimizer}>Optimize My Project</button>
              </div>
              {delayResult && (
                <div className="mini-grid">
                  <MetricCard title="Timeline Impact" value={`${delayResult.timelineImpactWeeks}w`} accent="#fbbf24" />
                  <MetricCard title="Cost Increase" value={`$${Math.round(delayResult.estimatedCostIncrease).toLocaleString()}`} accent="#fb7185" />
                  <MetricCard title="Risk Increase" value={`+${delayResult.riskIncrease}`} accent="#22d3ee" />
                </div>
              )}
              {optimizerResult && (
                <div className="optimizer-result">
                  <h3>Optimized Plan</h3>
                  <p>{`Cost: $${Math.round(optimizerResult.before.costUsd).toLocaleString()} to $${Math.round(optimizerResult.after.costUsd).toLocaleString()}`}</p>
                  <p>{`Timeline: ${optimizerResult.before.timelineWeeks}w to ${optimizerResult.after.timelineWeeks}w`}</p>
                  <p>{`Risk: ${optimizerResult.before.riskLevel} to ${optimizerResult.after.riskLevel}`}</p>
                  <p>{`Health: ${optimizerResult.before.health?.score}/100 to ${optimizerResult.after.health?.score}/100`}</p>
                </div>
              )}
            </div>
            {result.result.explanation && (
              <div className="panel ai-insights">
                <div className="section-title compact">
                  <h2>Explainable Insights</h2>
                  <p>{result.result.explanation.summary} Confidence: {result.result.explanation.confidence}.</p>
                </div>
                <div className="insight-grid">
                  <div>
                    <h3>Top Drivers</h3>
                    <ul>{result.result.explanation.topDrivers.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div>
                    <h3>Recommendations</h3>
                    <ul>{result.result.explanation.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                  <div>
                    <h3>What-if Analysis</h3>
                    <ul>{result.result.explanation.whatIf.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
