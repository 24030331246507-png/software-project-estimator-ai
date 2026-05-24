import os
from datetime import datetime
from pathlib import Path

from flask import current_app
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_prediction_report(prediction):
    Path(current_app.config["REPORT_FOLDER"]).mkdir(parents=True, exist_ok=True)
    file_name = f"prediction_{prediction.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    path = os.path.join(current_app.config["REPORT_FOLDER"], file_name)
    doc = SimpleDocTemplate(path, pagesize=A4)
    styles = getSampleStyleSheet()
    result = prediction.result_json
    inputs = prediction.inputs_json
    elements = [
        Paragraph("Cost & Time Project Analysis Report", styles["Title"]),
        Spacer(1, 16),
        Paragraph(f"Project: {prediction.project_name}", styles["Heading2"]),
        Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]),
        Spacer(1, 14),
    ]
    rows = [
        ["Metric", "Prediction"],
        ["Estimated Cost", f"${result['costUsd']:,.2f}"],
        ["Timeline", f"{result['timelineWeeks']} weeks"],
        ["Risk Level", result["riskLevel"]],
        ["Recommended Team", f"{result['recommendedTeamSize']} people"],
        ["Success Probability", f"{result['successProbability']}%"],
    ]
    table = Table(rows, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.extend([table, Spacer(1, 16), Paragraph("Input Snapshot", styles["Heading3"])])
    elements.append(Paragraph(", ".join(f"{key}: {value}" for key, value in inputs.items()), styles["BodyText"]))
    if prediction.pert_json:
        elements.extend([Spacer(1, 16), Paragraph("PERT/CPM Summary", styles["Heading3"])])
        elements.append(Paragraph(f"Critical Path: {' -> '.join(prediction.pert_json.get('criticalPath', []))}", styles["BodyText"]))
        elements.append(Paragraph(f"PERT Duration: {prediction.pert_json.get('projectDuration')} weeks", styles["BodyText"]))
    doc.build(elements)
    return path
