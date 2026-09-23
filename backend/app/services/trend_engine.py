from typing import Dict, Any, List
from app.database import get_db_connection
from app.services.baseline_engine import calculate_machine_baseline

def analyze_machine_trends(machine_id: str) -> Dict[str, Any]:
    """
    Analyzes directional trends (INCREASING, DECREASING, STABLE) for key metrics
    by comparing recent 5 logs against historical baselines.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT idling_time, fuel_used, load_cycles, timestamp
        FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 5
    """, (machine_id,))
    recent_rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM incidents WHERE machine_id = ?", (machine_id,))
    incident_count = cursor.fetchone()[0]

    conn.close()

    if not recent_rows:
        return {
            "machine_id": machine_id,
            "trends": []
        }

    baseline = calculate_machine_baseline(machine_id)
    if not baseline:
        return {"machine_id": machine_id, "trends": []}

    logs = [dict(r) for r in recent_rows]
    recent_idle_avg = float(sum(l["idling_time"] for l in logs) / len(logs))
    recent_fuel_avg = float(sum(l["fuel_used"] for l in logs) / len(logs))
    recent_cycles_avg = float(sum(l["load_cycles"] for l in logs) / len(logs))

    trends = []

    # 1. Idle time trend
    hist_idle = baseline["idling_time"]["mean"]
    idle_change_pct = round(((recent_idle_avg - hist_idle) / hist_idle * 100), 1) if hist_idle > 0 else 0.0
    if idle_change_pct > 20.0:
        idle_trend = "INCREASING"
        idle_sev = "WARNING" if idle_change_pct < 50.0 else "CRITICAL"
        idle_msg = f"Idle time has increased by {idle_change_pct}% over recent operations compared to historical baseline."
    elif idle_change_pct < -20.0:
        idle_trend = "DECREASING"
        idle_sev = "NORMAL"
        idle_msg = f"Idle time has decreased by {abs(idle_change_pct)}%, showing improved operational efficiency."
    else:
        idle_trend = "STABLE"
        idle_sev = "NORMAL"
        idle_msg = "Idle time remains steady near historical average."

    trends.append({
        "metric": "idling_time",
        "trend": idle_trend,
        "change_percent": idle_change_pct,
        "severity": idle_sev,
        "message": idle_msg
    })

    # 2. Fuel consumption trend
    hist_fuel = baseline["fuel_used"]["mean"]
    fuel_change_pct = round(((recent_fuel_avg - hist_fuel) / hist_fuel * 100), 1) if hist_fuel > 0 else 0.0
    if fuel_change_pct > 20.0:
        fuel_trend = "INCREASING"
        fuel_sev = "WARNING"
        fuel_msg = f"Fuel consumption per log has increased by {fuel_change_pct}% above baseline."
    elif fuel_change_pct < -20.0:
        fuel_trend = "DECREASING"
        fuel_sev = "NORMAL"
        fuel_msg = "Fuel usage has decreased recently."
    else:
        fuel_trend = "STABLE"
        fuel_sev = "NORMAL"
        fuel_msg = "Fuel consumption rate remains stable."

    trends.append({
        "metric": "fuel_used",
        "trend": fuel_trend,
        "change_percent": fuel_change_pct,
        "severity": fuel_sev,
        "message": fuel_msg
    })

    # 3. Load cycles trend
    hist_cycles = baseline["load_cycles"]["mean"]
    cycles_change_pct = round(((recent_cycles_avg - hist_cycles) / hist_cycles * 100), 1) if hist_cycles > 0 else 0.0
    cycles_trend = "INCREASING" if cycles_change_pct > 15.0 else ("DECREASING" if cycles_change_pct < -15.0 else "STABLE")
    trends.append({
        "metric": "load_cycles",
        "trend": cycles_trend,
        "change_percent": cycles_change_pct,
        "severity": "NORMAL",
        "message": f"Load productivity is {cycles_trend.lower()} relative to baseline."
    })

    return {
        "machine_id": machine_id,
        "trends": trends
    }
