import os
import requests
from typing import Dict, Any, List
from app.database import get_db_connection
from app.services.safety_engine import evaluate_machine_safety
from app.services.anomaly_detector import detect_machine_anomaly
from app.services.baseline_engine import calculate_machine_baseline
from app.services.trend_engine import analyze_machine_trends
from app.services.recommendation_engine import generate_structured_recommendations
from app.services.machine_intelligence import compute_machine_intelligence

def query_operator_assistant(machine_id: str, operator_id: str = None, message: str = "") -> Dict[str, Any]:
    """
    Tool-backed AI Operator Assistant for CAT machinery.
    Retrieves machine facts, safety alerts, ML anomalies, baselines, and intelligence scores.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Retrieve latest log for machine
    cursor.execute("""
        SELECT * FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (machine_id,))
    row = cursor.fetchone()

    # Retrieve active incidents
    cursor.execute("""
        SELECT * FROM incidents
        WHERE machine_id = ? AND status != 'RESOLVED'
        ORDER BY timestamp DESC
    """, (machine_id,))
    inc_rows = cursor.fetchall()
    incidents = [dict(r) for r in inc_rows]
    conn.close()

    if not row:
        return {
            "answer": f"No machine records found for Machine ID {machine_id}.",
            "recommendations": ["Verify machine ID and ensure machine telemetry sensors are online."],
            "context_used": {"machine_id": machine_id}
        }

    log = dict(row)
    actual_operator = operator_id if operator_id else log["operator_id"]

    # Gather tool context outputs
    safety_data = evaluate_machine_safety(machine_id)
    anomaly_data = detect_machine_anomaly(machine_id)
    trends_data = analyze_machine_trends(machine_id)
    intel_data = compute_machine_intelligence(machine_id)

    context = {
        "machine_id": machine_id,
        "operator_id": actual_operator,
        "timestamp": log["timestamp"],
        "seatbelt_status": log["seatbelt_status"],
        "idling_time": log["idling_time"],
        "fuel_used": log["fuel_used"],
        "load_cycles": log["load_cycles"],
        "safety_alert_triggered": log["safety_alert_triggered"],
        "risk_level": intel_data["risk_level"],
        "overall_risk": intel_data["overall_risk"],
        "safety_score": intel_data["safety_score"],
        "active_alerts": safety_data["active_alerts"],
        "anomaly_reason": anomaly_data.get("reason"),
        "key_findings": intel_data["key_findings"],
        "trends": trends_data.get("trends", []),
        "active_incidents": incidents
    }

    # Try LLM providers if keys exist
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if groq_key and groq_key.strip():
        llm_response = call_groq_llm(groq_key, context, message)
        if llm_response:
            return llm_response

    if gemini_key and gemini_key.strip():
        llm_response = call_gemini_llm(gemini_key, context, message)
        if llm_response:
            return llm_response

    # Fallback Deterministic Assistant Logic (No API Key Required)
    return generate_deterministic_response(context, message, intel_data)

def explain_machine_alert(machine_id: str, alert_id: str = None) -> Dict[str, Any]:
    """
    Signature 'Why?' feature explaining safety alerts using actual database evidence and baseline statistics.
    """
    safety = evaluate_machine_safety(machine_id)
    anomaly = detect_machine_anomaly(machine_id)
    baseline = calculate_machine_baseline(machine_id)
    trends = analyze_machine_trends(machine_id)
    intel = compute_machine_intelligence(machine_id)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machine_logs WHERE machine_id = ? ORDER BY timestamp DESC LIMIT 1", (machine_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {
            "alert": "No machine data",
            "severity": "LOW",
            "why": f"No telemetry recorded for machine {machine_id}.",
            "evidence": [],
            "recommendations": []
        }

    log = dict(row)
    evidence = []
    why_parts = []

    # Gather evidence
    idle_val = log["idling_time"]
    exp_idle = baseline.get("idling_time", {}).get("mean", 24.0)
    idle_dev = round(((idle_val - exp_idle) / exp_idle * 100), 1) if exp_idle > 0 else 0.0

    if log["seatbelt_status"] == "Unfastened":
        why_parts.append("a seatbelt violation")
        evidence.append("Seatbelt: Unfastened")

    if idle_val > 45:
        why_parts.append(f"excessive engine idle time ({idle_val} mins)")
        evidence.append(f"Idle time: {idle_val} minutes")
        evidence.append(f"Historical average: {exp_idle} minutes")
        evidence.append(f"Deviation: +{idle_dev}%")

    if anomaly.get("anomaly"):
        why_parts.append(f"ML operational anomaly ({anomaly.get('reason')})")
        for factor in anomaly.get("contributing_factors", []):
            evidence.append(f"{factor['feature']}: {factor['value']} (expected {factor['expected']}, deviation {factor['deviation_percent']}%)")

    if why_parts:
        alert_name = "Safety Alert & Operational Violation"
        severity = intel["risk_level"]
        why_text = f"{machine_id} recorded " + ", and ".join(why_parts) + "."
    else:
        alert_name = "Normal Operation Status"
        severity = "LOW"
        why_text = f"{machine_id} is operating within normal baseline parameters."
        evidence.append(f"Idle time: {idle_val} mins (historical avg {exp_idle} mins)")
        evidence.append(f"Seatbelt: {log['seatbelt_status']}")

    return {
        "alert": alert_name,
        "severity": severity,
        "why": why_text,
        "evidence": evidence,
        "recommendations": intel["recommended_actions"]
    }

def generate_deterministic_response(context: Dict[str, Any], message: str, intel_data: Dict[str, Any]) -> Dict[str, Any]:
    msg_lower = message.lower()
    machine_id = context["machine_id"]
    seatbelt = context["seatbelt_status"]
    idling = context["idling_time"]
    alert = context["safety_alert_triggered"]
    fuel = context["fuel_used"]

    recs = intel_data.get("recommended_actions", [])
    findings = context.get("key_findings", [])

    if "why" in msg_lower or "alert" in msg_lower or "what happened" in msg_lower:
        findings_str = "; ".join(findings)
        answer = f"Machine {machine_id} update: {findings_str}. Current Risk Level is {context['risk_level']} (Risk Score: {context['overall_risk']}/100)."
    elif "fuel" in msg_lower or "idle" in msg_lower:
        answer = f"Machine {machine_id} logged {fuel} L fuel consumption and {idling} minutes idle time. " \
                 f"{'Excessive idle detected.' if idling > 45 else 'Idle levels align with baseline.'}"
    else:
        answer = f"CAT Assistant Summary for {machine_id}: Risk Level = {context['risk_level']} ({context['overall_risk']}/100), " \
                 f"Safety Score = {context['safety_score']}/100. Seatbelt: {seatbelt}, Idle: {idling} min."

    return {
        "answer": answer,
        "recommendations": list(dict.fromkeys(recs)),
        "context_used": context
    }

def call_groq_llm(api_key: str, context: Dict[str, Any], message: str) -> Dict[str, Any]:
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        system_prompt = (
            "You are CAT Smart Operator Assistant for Caterpillar heavy machinery. "
            "Explain safety alerts, telemetry, and machine intelligence scores concisely. "
            "STRICT RULE: Only use facts provided in the context. Do not invent events."
        )
        prompt = f"Machine Context:\n{context}\n\nUser Question: {message}"
        payload = {
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "answer": data["choices"][0]["message"]["content"],
                "recommendations": ["Follow machine operating guidelines.", "Review recommended training modules."],
                "context_used": context
            }
    except Exception as e:
        print(f"[!] Groq LLM call failed: {e}")
    return None

def call_gemini_llm(api_key: str, context: Dict[str, Any], message: str) -> Dict[str, Any]:
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = (
            "You are CAT Smart Operator Assistant for Caterpillar machinery. "
            "Answer the operator query strictly using this context:\n"
            f"{context}\n\nUser Question: {message}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        resp = requests.post(url, json=payload, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "answer": data["candidates"][0]["content"]["parts"][0]["text"],
                "recommendations": ["Follow CAT standard operating safety procedures."],
                "context_used": context
            }
    except Exception as e:
        print(f"[!] Gemini LLM call failed: {e}")
    return None
