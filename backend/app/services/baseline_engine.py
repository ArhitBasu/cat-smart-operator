import numpy as np
from typing import Dict, Any, Optional
from app.database import get_db_connection

def calculate_machine_baseline(machine_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculates historical baseline statistics (mean, median, std_dev, min, max)
    for a machine or the entire fleet.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if machine_id:
        cursor.execute("""
            SELECT fuel_used, load_cycles, idling_time, engine_hours
            FROM machine_logs
            WHERE machine_id = ?
        """, (machine_id,))
    else:
        cursor.execute("""
            SELECT fuel_used, load_cycles, idling_time, engine_hours
            FROM machine_logs
        """)

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {}

    fuels = [r["fuel_used"] for r in rows]
    cycles = [r["load_cycles"] for r in rows]
    idles = [r["idling_time"] for r in rows]
    hours = [r["engine_hours"] for r in rows]

    def stats(arr):
        if not arr:
            return {"mean": 0.0, "median": 0.0, "std_dev": 0.0, "min": 0.0, "max": 0.0}
        std = float(np.std(arr))
        return {
            "mean": round(float(np.mean(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "std_dev": round(std, 2) if std > 0 else 0.01,
            "min": round(float(np.min(arr)), 2),
            "max": round(float(np.max(arr)), 2)
        }

    return {
        "machine_id": machine_id or "FLEET_AVERAGE",
        "total_records_analyzed": len(rows),
        "fuel_used": stats(fuels),
        "load_cycles": stats(cycles),
        "idling_time": stats(idles),
        "engine_hours": stats(hours)
    }

def compare_metric_to_baseline(machine_id: str, metric_name: str, current_value: float) -> Dict[str, Any]:
    """
    Compares a current metric value against historical baseline for machine_id.
    """
    baseline = calculate_machine_baseline(machine_id)
    if not baseline or metric_name not in baseline:
        return {
            "metric": metric_name,
            "current": current_value,
            "historical_average": current_value,
            "deviation_percent": 0.0,
            "z_score": 0.0,
            "status": "NORMAL"
        }

    stat = baseline[metric_name]
    avg = stat["mean"]
    std = stat["std_dev"] if stat["std_dev"] > 0 else 1.0

    dev_pct = round(((current_value - avg) / avg * 100), 1) if avg > 0 else 0.0
    z_score = round(((current_value - avg) / std), 2)

    if dev_pct > 25.0:
        status = "ABOVE_NORMAL"
    elif dev_pct < -25.0:
        status = "BELOW_NORMAL"
    else:
        status = "NORMAL"

    return {
        "metric": metric_name,
        "current": current_value,
        "historical_average": avg,
        "deviation_percent": dev_pct,
        "z_score": z_score,
        "status": status
    }
