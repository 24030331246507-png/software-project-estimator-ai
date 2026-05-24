import secrets
import string
from copy import deepcopy

from app.services.pert_cpm import build_schedule


def generate_project_code():
    alphabet = string.ascii_uppercase + string.digits
    return "PRJ-" + "".join(secrets.choice(alphabet) for _ in range(6))


def compute_health_score(result, pert=None):
    risk_score = float(result.get("riskScore", 50))
    success = float(result.get("successProbability", 60))
    timeline = float(result.get("timelineWeeks", 12))
    team_size = int(result.get("recommendedTeamSize", 6))
    critical_tasks = len(pert.get("criticalPath", [])) if pert else 0

    score = 100
    score -= risk_score * 0.38
    score += (success - 70) * 0.32
    score -= max(timeline - 24, 0) * 0.45
    score -= max(team_size - 10, 0) * 1.2
    score -= max(critical_tasks - 4, 0) * 2
    score = max(5, min(98, round(score, 1)))

    if score >= 80:
        status = "Healthy"
    elif score >= 62:
        status = "Watch"
    elif score >= 45:
        status = "At Risk"
    else:
        status = "Critical"

    alerts = []
    if risk_score >= 55:
        alerts.append("Risk is trending high; review scope, dependencies and requirements volatility.")
    if success < 65:
        alerts.append("Success probability is below the safe zone.")
    if timeline > 32:
        alerts.append("Timeline is long; check critical path and team velocity.")
    if pert and critical_tasks >= 5:
        alerts.append("Many tasks are on the critical path; delays will directly affect delivery.")
    if not alerts:
        alerts.append("Project health is stable. Continue weekly monitoring.")

    return {"score": score, "status": status, "alerts": alerts}


def apply_realtime_factors(result, inputs):
    weather = float(inputs.get("weather_risk", 20))
    material = float(inputs.get("material_cost_index", 100))
    vendor = float(inputs.get("vendor_reliability", 75))
    regulatory = float(inputs.get("regulatory_delay_risk", 20))
    row = float(inputs.get("right_of_way_risk", 20))

    cost_multiplier = 1 + max(material - 100, 0) / 180 + weather / 600 + row / 700
    timeline_multiplier = 1 + weather / 500 + regulatory / 420 + row / 360 + max(70 - vendor, 0) / 500
    risk_addition = weather * 0.08 + regulatory * 0.14 + row * 0.16 + max(70 - vendor, 0) * 0.12

    adjusted = dict(result)
    adjusted["costUsd"] = round(float(adjusted["costUsd"]) * cost_multiplier, 2)
    adjusted["timelineWeeks"] = round(float(adjusted["timelineWeeks"]) * timeline_multiplier, 1)
    adjusted["riskScore"] = round(min(95, float(adjusted["riskScore"]) + risk_addition), 1)
    adjusted["successProbability"] = round(max(20, float(adjusted["successProbability"]) - risk_addition * 0.7), 1)
    adjusted["riskLevel"] = "Low" if adjusted["riskScore"] < 28 else "Medium" if adjusted["riskScore"] < 48 else "High" if adjusted["riskScore"] < 68 else "Critical"
    adjusted["realtimeFactors"] = {
        "weatherRisk": weather,
        "materialCostIndex": material,
        "vendorReliability": vendor,
        "regulatoryDelayRisk": regulatory,
        "rightOfWayRisk": row,
        "impactSummary": [
            "Weather and right-of-way risks affect field execution timelines.",
            "Material cost index affects budget overrun probability.",
            "Vendor reliability affects schedule adherence and rework risk.",
            "Regulatory delay risk affects approval-dependent critical path tasks.",
        ],
    }
    return adjusted


def simulate_delay(record, task_id, delay_weeks):
    if not record.pert_json:
        raise ValueError("This project does not have PERT/CPM task data.")
    tasks = deepcopy(record.pert_json["tasks"])
    target = None
    for task in tasks:
        if task["id"] == task_id:
            target = task
            break
    if not target:
        raise ValueError("Task ID was not found in this project.")

    original_duration = float(record.pert_json["projectDuration"])
    target["mostLikely"] = float(target.get("mostLikely", target.get("duration", 1))) + float(delay_weeks)
    target["pessimistic"] = float(target.get("pessimistic", target.get("duration", 1))) + float(delay_weeks)
    updated = build_schedule(tasks)
    new_duration = float(updated["projectDuration"])
    timeline_delta = max(0, round(new_duration - original_duration, 2))
    cost_delta = round(float(record.result_json.get("costUsd", 0)) * 0.015 * timeline_delta, 2)
    risk_delta = round(min(25, timeline_delta * 2.2), 1)
    return {
        "taskId": task_id,
        "delayWeeks": float(delay_weeks),
        "oldDuration": original_duration,
        "newDuration": new_duration,
        "timelineImpactWeeks": timeline_delta,
        "estimatedCostIncrease": cost_delta,
        "riskIncrease": risk_delta,
        "affectedCriticalPath": updated["criticalPath"],
        "recommendations": [
            "Add temporary support to the delayed critical task.",
            "Move non-critical work in parallel where dependencies allow.",
            "Review scope trade-offs if timeline impact is greater than one week.",
        ],
    }


def optimize_inputs(inputs):
    optimized = dict(inputs)
    optimized["requirements_volatility"] = max(5, float(optimized["requirements_volatility"]) - 12)
    optimized["reuse_percent"] = min(70, float(optimized["reuse_percent"]) + 18)
    optimized["team_velocity"] = min(60, float(optimized["team_velocity"]) + 8)
    optimized["team_experience"] = min(10, float(optimized["team_experience"]) + 1.2)
    return optimized


def analyze_project_problems(records):
    problems = []
    for record in records:
        result = record.result_json or {}
        inputs = record.inputs_json or {}
        pert = record.pert_json or {}
        health = result.get("health") or compute_health_score(result, pert)
        project = record.project_name

        def add_problem(kind, severity, statement, root_cause, action_plan, expected_impact):
            problems.append({
                "projectId": record.id,
                "projectName": project,
                "projectCode": result.get("projectCode", "N/A"),
                "type": kind,
                "severity": severity,
                "statement": statement,
                "rootCause": root_cause,
                "actionPlan": action_plan,
                "expectedImpact": expected_impact,
                "healthScore": health.get("score"),
            })

        if health.get("score", 100) < 62:
            add_problem(
                "Project Health",
                "Critical" if health.get("score", 100) < 45 else "High",
                f"{project} health score is {health.get('score')}/100 and needs management attention.",
                "Risk, timeline, success probability or critical-path pressure is outside the safe zone.",
                ["Run optimizer", "Review critical path", "Assign owner for top risk within 24 hours"],
                "Can improve delivery confidence and reduce avoidable escalation.",
            )
        if result.get("riskScore", 0) >= 55:
            add_problem(
                "Risk Escalation",
                "High",
                f"{project} has elevated risk score {result.get('riskScore')}.",
                "Scope complexity, volatile requirements, security level or integrations are increasing delivery risk.",
                ["Freeze scope baseline", "Create mitigation plan", "Review risky integrations early"],
                "Expected to reduce risk score and improve success probability.",
            )
        if inputs.get("complexity") == "Critical" and inputs.get("features", 0) >= 70:
            add_problem(
                "Delivery Feasibility",
                "Critical",
                f"{project} combines critical complexity with very large scope.",
                "The project scope is too large for predictable delivery without phased execution.",
                ["Split into MVP, release-2 and release-3", "Approve only must-have features", "Add architecture checkpoint before development"],
                "Can convert an unsafe big-bang plan into a controlled staged delivery.",
            )
        if inputs.get("team_velocity", 99) < 22 and inputs.get("team_experience", 10) < 4:
            add_problem(
                "Resource Capacity Mismatch",
                "High",
                f"{project} has low velocity and low team experience for the requested scope.",
                "The current team capacity is unlikely to absorb complexity, integrations and rework.",
                ["Add one senior developer", "Reduce parallel work-in-progress", "Run technical design review twice per sprint"],
                "Can reduce delivery risk and improve sprint predictability.",
            )
        if result.get("successProbability", 100) < 65:
            add_problem(
                "Low Success Probability",
                "High",
                f"{project} success probability is below target at {result.get('successProbability')}%.",
                "Project assumptions are weak compared with delivery capacity and uncertainty.",
                ["Increase senior review", "Reduce non-critical features", "Improve reuse percentage"],
                "Can raise success probability before execution starts.",
            )
        if result.get("timelineWeeks", 0) > 32:
            add_problem(
                "Timeline Delay Risk",
                "Medium",
                f"{project} has a long estimated timeline of {result.get('timelineWeeks')} weeks.",
                "Critical path, feature count or team velocity is likely stretching delivery.",
                ["Simulate delay on critical tasks", "Parallelize independent work", "Increase team velocity"],
                "Can reduce schedule overrun and improve planning accuracy.",
            )
        if inputs.get("requirements_volatility", 0) >= 35:
            add_problem(
                "Requirement Volatility",
                "Medium",
                f"{project} requirements volatility is high at {inputs.get('requirements_volatility')}%.",
                "Frequent requirement changes can increase rework, cost and timeline.",
                ["Use change-control board", "Lock sprint scope", "Track requirement churn weekly"],
                "Can reduce rework and stabilize cost forecast.",
            )
        if inputs.get("right_of_way_risk", 0) >= 50:
            add_problem(
                "Right-of-Way Risk",
                "High",
                f"{project} has high right-of-way risk at {inputs.get('right_of_way_risk')}%.",
                "Land, permissions or route clearance can delay field execution and approvals.",
                ["Start right-of-way clearance tracking", "Escalate blocked zones", "Add approval buffer in CPM"],
                "Can reduce approval-driven schedule slippage.",
            )
        if inputs.get("regulatory_delay_risk", 0) >= 50:
            add_problem(
                "Regulatory Delay",
                "High",
                f"{project} has high regulatory delay risk at {inputs.get('regulatory_delay_risk')}%.",
                "Approval dependencies can block downstream critical path work.",
                ["Track approval owners", "Add compliance review milestone", "Prepare fallback documentation"],
                "Can prevent approval bottlenecks from delaying delivery.",
            )
        if inputs.get("vendor_reliability", 100) < 60:
            add_problem(
                "Vendor Reliability",
                "Medium",
                f"{project} vendor reliability is low at {inputs.get('vendor_reliability')}%.",
                "Vendor slippage can create procurement and execution delays.",
                ["Identify backup vendor", "Add vendor SLA checkpoints", "Monitor delivery milestones weekly"],
                "Can reduce procurement-driven timeline risk.",
            )
        if len(pert.get("criticalPath", [])) >= 5:
            add_problem(
                "Critical Path Pressure",
                "Medium",
                f"{project} has {len(pert.get('criticalPath', []))} critical-path tasks.",
                "Too many tasks have zero slack, so small delays can affect final delivery.",
                ["Add buffer to critical tasks", "Move non-critical work in parallel", "Monitor blockers daily"],
                "Can prevent small task delays from becoming project delays.",
            )
        for task in pert.get("tasks", []):
            owner = task.get("assignedTo") or "Unassigned"
            status = task.get("status") or "Pending"
            progress = float(task.get("progress") or 0)
            task_label = f"{task.get('id')} - {task.get('name')}"
            if status == "Blocked":
                add_problem(
                    "Blocked Task Ownership",
                    "High" if task.get("critical") else "Medium",
                    f"{project} task {task_label} is blocked and assigned to {owner}.",
                    "A blocked task can delay dependent tasks, especially when it is on the critical path.",
                    [f"Ask {owner} for blocker details", "Assign escalation owner", "Update recovery date today"],
                    "Can prevent ownership gaps from becoming timeline slippage.",
                )
            if owner == "Unassigned":
                add_problem(
                    "Unassigned Responsibility",
                    "Medium",
                    f"{project} task {task_label} has no clear owner.",
                    "Tasks without ownership often create communication gaps and execution delays.",
                    ["Assign a named owner", "Set role and expected progress", "Review ownership in daily standup"],
                    "Can improve accountability and execution visibility.",
                )
            if task.get("critical") and status != "Completed" and progress < 25:
                add_problem(
                    "Critical Task Low Progress",
                    "High",
                    f"{project} critical task {task_label} is only {progress}% complete.",
                    "Critical-path task progress is behind the level expected for safe delivery.",
                    [f"Review progress with {owner}", "Add support or split the task", "Run delay simulation for this task"],
                    "Can reduce critical-path delay risk.",
                )

    severity_rank = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    problems.sort(key=lambda item: (severity_rank.get(item["severity"], 4), item["projectName"]))
    return {
        "count": len(problems),
        "critical": sum(1 for item in problems if item["severity"] == "Critical"),
        "high": sum(1 for item in problems if item["severity"] == "High"),
        "medium": sum(1 for item in problems if item["severity"] == "Medium"),
        "problems": problems[:30],
    }
