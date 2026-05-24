import React from "react";

export default function GanttChart({ schedule }) {
  if (!schedule?.tasks?.length) return null;
  const duration = Math.max(schedule.projectDuration, 1);
  const scaleStep = Math.max(Math.ceil(duration / 6), 1);
  const scalePoints = Array.from(
    { length: Math.floor(duration / scaleStep) + 1 },
    (_, index) => index * scaleStep,
  );
  if (scalePoints[scalePoints.length - 1] !== duration) {
    scalePoints.push(duration);
  }

  return (
    <div className="gantt">
      <div className="section-title">
        <h2>PERT, CPM and Gantt View</h2>
        <p>Critical path: {schedule.criticalPath.join(" to ") || "None"}</p>
      </div>
      <div className="pert-summary">
        <div><strong>{schedule.projectDuration}</strong><span>Expected weeks</span></div>
        <div><strong>{schedule.p80Duration}</strong><span>P80 safer plan</span></div>
        <div><strong>{schedule.p95Duration}</strong><span>P95 contingency</span></div>
        <div><strong>{schedule.scheduleRisk}</strong><span>Schedule risk</span></div>
      </div>
      <div className="pert-alerts">
        {(schedule.alerts || []).map((alert) => <span key={alert}>{alert}</span>)}
      </div>

      <div className="gantt-board">
        <div className="gantt-scale">
          <span>Task</span>
          <div>
            {scalePoints.map((point) => (
              <small key={point} style={{ left: `${(point / duration) * 100}%` }}>
                W{point}
              </small>
            ))}
          </div>
        </div>

        {schedule.tasks.map((task) => {
          const left = (task.earlyStart / duration) * 100;
          const width = Math.max((task.duration / duration) * 100, 5);
          const progress = Math.min(Math.max(Number(task.progress || 0), 0), 100);
          return (
            <div className="gantt-row" key={task.id}>
              <div className="gantt-task-info">
                <strong>{task.id}. {task.name}</strong>
                <span>{task.assignedTo || "Unassigned"} / {task.role || "Team"} / {task.status || "Pending"}</span>
                <small>ES {task.earlyStart} | EF {task.earlyFinish} | Slack {task.slack}w</small>
              </div>
              <div className="gantt-track">
                <div
                  className={task.critical ? "gantt-bar critical" : "gantt-bar"}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${task.name}: ${task.duration} weeks, ${progress}% complete`}
                >
                  <span className="gantt-progress" style={{ width: `${progress}%` }} />
                  <span className="gantt-bar-label">{task.duration}w</span>
                </div>
              </div>
              <div className="gantt-details">
                <span className={task.critical ? "status-pill blocked" : "status-pill"}>{task.critical ? "Critical" : "Flexible"}</span>
                <span>{progress}% done</span>
                <span>LS {task.lateStart} / LF {task.lateFinish}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
