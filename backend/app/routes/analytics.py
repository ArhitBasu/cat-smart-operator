from fastapi import APIRouter, HTTPException
from app.schemas import AnalyticsResponse, TimeSeriesPoint
from app.database import get_db_connection

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/{machine_id}", response_model=AnalyticsResponse, description="Fetch time-series telemetry data formatted for Recharts components")
def get_machine_analytics(machine_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")

    cursor.execute("""
        SELECT timestamp, fuel_used, idling_time, load_cycles, engine_hours, seatbelt_status, safety_alert_triggered
        FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp ASC
        LIMIT 50
    """, (machine_id,))
    rows = cursor.fetchall()
    conn.close()

    fuel_ts = []
    idle_ts = []
    cycles_ts = []
    hours_ts = []
    seatbelt_list = []
    alerts_list = []

    for r in rows:
        ts = r["timestamp"]
        fuel_ts.append(TimeSeriesPoint(timestamp=ts, value=float(r["fuel_used"])))
        idle_ts.append(TimeSeriesPoint(timestamp=ts, value=float(r["idling_time"])))
        cycles_ts.append(TimeSeriesPoint(timestamp=ts, value=float(r["load_cycles"])))
        hours_ts.append(TimeSeriesPoint(timestamp=ts, value=float(r["engine_hours"])))

        seatbelt_list.append({
            "timestamp": ts,
            "status": r["seatbelt_status"],
            "is_fastened": 1 if r["seatbelt_status"] == "Fastened" else 0
        })

        alerts_list.append({
            "timestamp": ts,
            "alert_triggered": r["safety_alert_triggered"],
            "has_alert": 1 if r["safety_alert_triggered"] == "Yes" else 0
        })

    return AnalyticsResponse(
        machine_id=machine_id,
        fuel=fuel_ts,
        idle_time=idle_ts,
        load_cycles=cycles_ts,
        engine_hours=hours_ts,
        seatbelt_status=seatbelt_list,
        safety_alerts=alerts_list
    )
