from typing import List, Dict, Any
from app.services.safety_engine import evaluate_machine_safety
from app.services.anomaly_detector import detect_machine_anomaly

def generate_structured_recommendations(machine_id: str) -> List[Dict[str, Any]]:
    """
    Transforms detected safety events, idle behavior, and ML anomalies
    into structured actionable recommendations with priority levels and training links.
    """
    safety = evaluate_machine_safety(machine_id)
    anomaly = detect_machine_anomaly(machine_id)

    recommendations = []

    # 1. Seatbelt Violation
    for alert in safety.get("active_alerts", []):
        if alert["alert_type"] == "SEATBELT":
            recommendations.append({
                "priority": "CRITICAL" if safety["risk_level"] == "CRITICAL" else "HIGH",
                "category": "SAFETY",
                "title": "Seatbelt Safety Action",
                "message": "Secure seatbelt restraint immediately before machinery movement.",
                "training_module": "Seatbelt Safety & Protocols"
            })
        elif alert["alert_type"] == "IDLE":
            recommendations.append({
                "priority": "HIGH" if alert["severity"] == "HIGH" else "MEDIUM",
                "category": "EFFICIENCY",
                "title": "Idle Management Action",
                "message": alert["recommendation"],
                "training_module": "Fuel Efficiency & Idle Management"
            })
        elif alert["alert_type"] == "FUEL":
            recommendations.append({
                "priority": "HIGH",
                "category": "MAINTENANCE",
                "title": "Fuel Efficiency Inspection",
                "message": alert["recommendation"],
                "training_module": "Fuel Efficiency & Idle Management"
            })

    # 2. ML Operational Anomaly
    if anomaly.get("anomaly"):
        recommendations.append({
            "priority": "HIGH",
            "category": "OPERATIONAL",
            "title": "Operational Anomaly Investigation",
            "message": f"Investigate machine operating parameters: {anomaly.get('reason')}",
            "training_module": "Excavator Safe Operation"
        })

    # Fallback standard recommendation if empty
    if not recommendations:
        recommendations.append({
            "priority": "LOW",
            "category": "GENERAL",
            "title": "Standard Operating Protocol",
            "message": "Continue standard operational monitoring and regular shift maintenance checks.",
            "training_module": "Hazard Awareness & Site Safety"
        })

    # De-duplicate by title
    seen = set()
    unique_recs = []
    for r in recommendations:
        if r["title"] not in seen:
            seen.add(r["title"])
            unique_recs.append(r)

    return unique_recs
