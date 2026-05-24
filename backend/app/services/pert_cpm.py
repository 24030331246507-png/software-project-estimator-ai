from collections import defaultdict, deque


def build_schedule(tasks):
    if not tasks:
        return {"tasks": [], "criticalPath": [], "projectDuration": 0}

    task_map = {}
    for task in tasks:
        optimistic = float(task.get("optimistic", task.get("duration", 1)))
        most_likely = float(task.get("mostLikely", task.get("duration", optimistic)))
        pessimistic = float(task.get("pessimistic", task.get("duration", most_likely)))
        expected = round((optimistic + 4 * most_likely + pessimistic) / 6, 2)
        variance = round(((pessimistic - optimistic) / 6) ** 2, 3)
        task_map[task["id"]] = {
            **task,
            "dependencies": task.get("dependencies", []),
            "duration": expected,
            "variance": variance,
            "earlyStart": 0,
            "earlyFinish": 0,
            "lateStart": 0,
            "lateFinish": 0,
            "slack": 0,
            "critical": False,
        }

    graph = defaultdict(list)
    indegree = {tid: 0 for tid in task_map}
    for tid, task in task_map.items():
        for dep in task["dependencies"]:
            if dep in task_map:
                graph[dep].append(tid)
                indegree[tid] += 1

    queue = deque([tid for tid, degree in indegree.items() if degree == 0])
    order = []
    while queue:
        tid = queue.popleft()
        order.append(tid)
        for nxt in graph[tid]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(task_map):
        raise ValueError("PERT/CPM dependencies contain a cycle or unknown task chain.")

    for tid in order:
        task = task_map[tid]
        task["earlyStart"] = max([task_map[d]["earlyFinish"] for d in task["dependencies"] if d in task_map] or [0])
        task["earlyFinish"] = round(task["earlyStart"] + task["duration"], 2)

    project_duration = max(task["earlyFinish"] for task in task_map.values())
    for tid in reversed(order):
        task = task_map[tid]
        successors = graph[tid]
        task["lateFinish"] = min([task_map[s]["lateStart"] for s in successors] or [project_duration])
        task["lateStart"] = round(task["lateFinish"] - task["duration"], 2)
        task["slack"] = round(task["lateStart"] - task["earlyStart"], 2)
        task["critical"] = abs(task["slack"]) < 0.01

    critical_path = [tid for tid in order if task_map[tid]["critical"]]
    critical_variance = sum(task_map[tid].get("variance", 0) for tid in critical_path)
    std_dev = critical_variance ** 0.5
    p80_duration = round(project_duration + 0.84 * std_dev, 2)
    p95_duration = round(project_duration + 1.65 * std_dev, 2)
    schedule_risk = "Low" if std_dev < 1 else "Medium" if std_dev < 2.5 else "High"
    alerts = []
    if len(critical_path) >= 5:
        alerts.append("Critical path has many zero-slack tasks; monitor daily.")
    if schedule_risk == "High":
        alerts.append("PERT variance is high; use P80/P95 duration for safer planning.")
    for task in task_map.values():
        if task.get("status") == "Blocked":
            alerts.append(f"Task {task['id']} is blocked and can delay dependent work.")
        if task.get("critical") and float(task.get("progress") or 0) < 25 and task.get("status") != "Completed":
            alerts.append(f"Critical task {task['id']} has low progress.")
    if not alerts:
        alerts.append("PERT/CPM schedule is stable under current task assumptions.")
    return {
        "tasks": list(task_map.values()),
        "criticalPath": critical_path,
        "projectDuration": round(project_duration, 2),
        "criticalVariance": round(critical_variance, 3),
        "standardDeviation": round(std_dev, 2),
        "p80Duration": p80_duration,
        "p95Duration": p95_duration,
        "scheduleRisk": schedule_risk,
        "alerts": alerts[:6],
    }
