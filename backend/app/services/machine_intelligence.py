from typing import Dict, Any, List
from app.services.safety_engine import evaluate_machine_safety
from app.services.anomaly_detector import detect_machine_anomaly
from app.services.baseline_engine import calculate_machine_baseline
from app.services.trend_engine import analyze_machine_trends
from app.services.recommendation_engine import generate_structured_recommendations

def compute_machine_intelligence(machine_id: str) -> Dict[str, Any]:
    """
    Computes unified machine intelligence, risk indicators, positive 0-100 sub-scores,
    key findings, trends, and recommended actions.
    
    Score Semantics:
    - overall_risk: 0-100 (HIGHER IS WORSE: 0=low risk, 100=critical risk)
    - safety_score: 0-100 (HIGHER IS BETTER: 100=strong safety)
    - efficiency_score: 0-100 (HIGHER IS BETTER: 100=strong efficiency)
    - machine_health_score: 0-100 (HIGHER IS BETTER: 100=healthy machine)
    - operator_safety_score: 0-100 (HIGHER IS BETTER: 100=strong behavior)
    """
    safety = evaluate_machine_safety(machine_id)
    anomaly = detect_machine_anomaly(machine_id)
    trends = analyze_machine_trends(machine_id)
    baseline = calculate_machine_baseline(machine_id)
    struct_recs = generate_structured_recommendations(machine_id)

    key_findings = []
    recommended_actions = [r["message"] for r in struct_recs]

    # 1. Safety Score (Higher is BETTER)
    # Deduct for seatbelt violations and safety alerts
    seatbelt_pct = safety["seatbelt_compliance"]["compliance_percentage"]
    active_alert_count = len(safety["active_alerts"])
    
    safety_deductions = 0
    if any(a["alert_type"] == "SEATBELT" for a in safety["active_alerts"]):
        safety_deductions += 35
        key_findings.append("Seatbelt violation detected during operation.")

    safety_deductions += (active_alert_count * 15)
    safety_score = max(0, min(100, int(round((seatbelt_pct * 0.5) + (50 - safety_deductions)))))

    # 2. Operator Safety Score (Higher is BETTER)
    op_deductions = 0
    if seatbelt_pct < 100.0:
        op_deductions += int((100.0 - seatbelt_pct) * 0.8)
    if active_alert_count > 0:
        op_deductions += (active_alert_count * 10)
    operator_safety_score = max(0, min(100, 100 - op_deductions))

    # 3. Efficiency Score (Higher is BETTER)
    eff_deductions = 0
    idle_factor = baseline.get("idling_time", {})
    exp_idle = idle_factor.get("mean", 25.0)
    
    # Check latest idle time from safety active_alerts or trends
    idle_trend = next((t for t in trends.get("trends", []) if t["metric"] == "idling_time"), {})
    if idle_trend.get("trend") == "INCREASING":
        dev = idle_trend.get("change_percent", 0.0)
        eff_deductions += min(40, int(dev * 0.3))
        key_findings.append(f"Idle time is significantly above historical baseline (+{dev}% deviation).")

    efficiency_score = max(0, min(100, 100 - eff_deductions))

    # 4. Machine Health Score (Higher is BETTER)
    health_deductions = 0
    if anomaly.get("anomaly"):
        health_deductions += 30
        key_findings.append(f"ML Operational Anomaly: {anomaly.get('reason')}")
        for factor in anomaly.get("contributing_factors", []):
            if factor["feature"] == "fuel_used":
                key_findings.append(f"Abnormal fuel consumption detected ({factor['value']}L vs expected {factor['expected']}L).")
    
    machine_health_score = max(0, min(100, 100 - health_deductions))

    # 5. Transparent Overall Risk Calculation (HIGHER IS WORSE)
    # Weights: Safety (30%), Anomalies (25%), Efficiency (20%), Health (15%), Trends (10%)
    safety_risk = (100 - safety_score) * 0.30
    anomaly_risk = (30 if anomaly.get("anomaly") else 0) * 0.25
    eff_risk = (100 - efficiency_score) * 0.20
    health_risk = (100 - machine_health_score) * 0.15
    trend_risk = (20 if idle_trend.get("trend") == "INCREASING" else 0) * 0.10

    raw_risk = safety_risk + anomaly_risk + eff_risk + health_risk + trend_risk
    overall_risk = max(0, min(100, int(round(raw_risk))))

    # Risk level mapping
    if overall_risk >= 70:
        risk_level = "CRITICAL" if any(a["alert_type"] == "SEATBELT" for a in safety["active_alerts"]) else "HIGH"
    elif overall_risk >= 45:
        risk_level = "HIGH"
    elif overall_risk >= 20:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    if not key_findings:
        key_findings.append("Machine telemetry aligns with historical baseline; no major risk anomalies detected.")

    return {
        "machine_id": machine_id,
        "overall_risk": overall_risk,
        "risk_level": risk_level,
        "safety_score": safety_score,
        "efficiency_score": efficiency_score,
        "machine_health_score": machine_health_score,
        "operator_safety_score": operator_safety_score,
        "key_findings": key_findings,
        "trends": trends.get("trends", []),
        "recommended_actions": list(dict.fromkeys(recommended_actions)),
        "score_semantics": {
            "overall_risk": "0-100 (Higher is WORSE)",
            "sub_scores": "0-100 (Higher is BETTER)"
        }
    }
