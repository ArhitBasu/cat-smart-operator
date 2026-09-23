from typing import List, Dict, Any
from app.database import get_db_connection

def evaluate_machine_safety(machine_id: str) -> Dict[str, Any]:
    """
    Evaluates rule-based safety intelligence for a given machine based on recent logs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get recent logs for this machine
    cursor.execute("""
        SELECT * FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 20
    """, (machine_id,))
    rows = cursor.fetchall()
    logs = [dict(r) for r in rows]

    if not logs:
        conn.close()
        return {
            "machine_id": machine_id,
            "operator_id": "N/A",
            "risk_level": "LOW",
            "safety_status": "NORMAL",
            "seatbelt_compliance": compute_seatbelt_compliance(machine_id=machine_id),
            "active_alerts": [],
            "recent_violations": [],
            "recommendations": ["No telemetry data recorded yet."]
        }

    latest_log = logs[0]
    operator_id = latest_log["operator_id"]

    alerts = []
    recommendations = []
    recent_violations = []

    # Rule A: Seatbelt compliance check on latest log & recent history
    if latest_log["seatbelt_status"] == "Unfastened":
        alerts.append({
            "severity": "HIGH",
            "alert_type": "SEATBELT",
            "message": f"Operator {operator_id} seatbelt is unfastened during operation.",
            "recommendation": "Secure seatbelt immediately before operating machinery."
        })
        recent_violations.append({
            "timestamp": latest_log["timestamp"],
            "type": "Seatbelt Unfastened",
            "severity": "HIGH"
        })
        recommendations.append("Secure seatbelt immediately.")
        recommendations.append("Complete Seatbelt Safety & Protocols (TRN-01) module.")

    # Rule B: Excessive idling
    idle_time = latest_log["idling_time"]
    if idle_time > 60:
        alerts.append({
            "severity": "HIGH",
            "alert_type": "IDLE",
            "message": f"Excessive engine idling detected ({idle_time} minutes).",
            "recommendation": "Shut down engine during extended waiting periods to save fuel and reduce engine wear."
        })
        recent_violations.append({
            "timestamp": latest_log["timestamp"],
            "type": f"Severe Idling ({idle_time} mins)",
            "severity": "HIGH"
        })
        recommendations.append("Reduce unnecessary idling; turn off engine when parked.")
        recommendations.append("Review Fuel Efficiency & Idle Management (TRN-03).")
    elif idle_time > 45:
        alerts.append({
            "severity": "MEDIUM",
            "alert_type": "IDLE",
            "message": f"Moderate engine idling detected ({idle_time} minutes).",
            "recommendation": "Monitor idle duration and avoid idling beyond 30 minutes."
        })
        recommendations.append("Monitor engine idle time.")

    # Rule C: Abnormal fuel usage
    fuel_used = latest_log["fuel_used"]
    load_cycles = latest_log["load_cycles"]
    if load_cycles > 0 and (fuel_used / load_cycles) > 1.2:
        alerts.append({
            "severity": "MEDIUM",
            "alert_type": "FUEL",
            "message": f"Abnormal fuel consumption per load cycle ({fuel_used:.1f}L for {load_cycles} cycles).",
            "recommendation": "Inspect hydraulic systems and engine throttle settings for inefficiency."
        })
        recommendations.append("Inspect machine hydraulic lines and fuel line pressure.")
    elif load_cycles <= 2 and fuel_used > 10.0:
        alerts.append({
            "severity": "HIGH",
            "alert_type": "FUEL",
            "message": f"Spike in fuel usage with minimal load cycles ({fuel_used:.1f}L for {load_cycles} cycle).",
            "recommendation": "Check for potential fuel leak or heavy hydraulic pressure drag."
        })

    # Historical violations check across recent 20 logs
    unfastened_count = sum(1 for l in logs if l["seatbelt_status"] == "Unfastened")
    high_idle_count = sum(1 for l in logs if l["idling_time"] > 60)

    # Determine overall risk level & safety status
    if any(a["severity"] == "HIGH" for a in alerts) and (unfastened_count > 1 or high_idle_count > 1):
        risk_level = "CRITICAL"
        safety_status = "CRITICAL"
    elif any(a["severity"] == "HIGH" for a in alerts):
        risk_level = "HIGH"
        safety_status = "WARNING"
    elif any(a["severity"] == "MEDIUM" for a in alerts):
        risk_level = "MEDIUM"
        safety_status = "WARNING"
    else:
        risk_level = "LOW"
        safety_status = "NORMAL"

    if not recommendations:
        recommendations.append("Machine is operating within normal safety limits. Continue standard operational protocols.")

    seatbelt_compliance_data = compute_seatbelt_compliance(conn=conn, machine_id=machine_id)
    conn.close()

    return {
        "machine_id": machine_id,
        "operator_id": operator_id,
        "risk_level": risk_level,
        "safety_status": safety_status,
        "seatbelt_compliance": seatbelt_compliance_data,
        "active_alerts": alerts,
        "recent_violations": recent_violations,
        "recommendations": list(dict.fromkeys(recommendations))  # Unique list
    }

def compute_seatbelt_compliance(conn=None, machine_id: str = None) -> Dict[str, Any]:
    close_conn = False
    if conn is None:
        conn = get_db_connection()
        close_conn = True

    cursor = conn.cursor()

    if machine_id:
        cursor.execute("SELECT seatbelt_status, operator_id FROM machine_logs WHERE machine_id = ?", (machine_id,))
    else:
        cursor.execute("SELECT seatbelt_status, operator_id FROM machine_logs")

    rows = cursor.fetchall()
    total_records = len(rows)
    fastened_count = sum(1 for r in rows if r["seatbelt_status"] == "Fastened")
    unfastened_count = total_records - fastened_count
    overall_pct = round((fastened_count / total_records * 100), 1) if total_records > 0 else 100.0

    # Operator-level compliance
    op_counts = {}
    for r in rows:
        op = r["operator_id"]
        if op not in op_counts:
            op_counts[op] = {"fastened": 0, "total": 0}
        op_counts[op]["total"] += 1
        if r["seatbelt_status"] == "Fastened":
            op_counts[op]["fastened"] += 1

    op_compliance = {
        op: round((data["fastened"] / data["total"] * 100), 1)
        for op, data in op_counts.items()
    }

    # Machine-level compliance
    cursor.execute("SELECT machine_id, seatbelt_status FROM machine_logs")
    m_rows = cursor.fetchall()
    m_counts = {}
    for r in m_rows:
        m = r["machine_id"]
        if m not in m_counts:
            m_counts[m] = {"fastened": 0, "total": 0}
        m_counts[m]["total"] += 1
        if r["seatbelt_status"] == "Fastened":
            m_counts[m]["fastened"] += 1

    m_compliance = {
        m: round((data["fastened"] / data["total"] * 100), 1)
        for m, data in m_counts.items()
    }

    if close_conn:
        conn.close()

    return {
        "total_records": total_records,
        "fastened_count": fastened_count,
        "unfastened_count": unfastened_count,
        "compliance_percentage": overall_pct,
        "operator_compliance": op_compliance,
        "machine_compliance": m_compliance
    }
