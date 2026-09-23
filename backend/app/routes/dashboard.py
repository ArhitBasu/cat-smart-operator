from fastapi import APIRouter, HTTPException
from app.schemas import DashboardResponse
from app.database import get_db_connection
from app.services.safety_engine import evaluate_machine_safety
from app.services.anomaly_detector import detect_machine_anomaly

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/{machine_id}", response_model=DashboardResponse, description="Fetch complete dashboard summary telemetry for a machine")
def get_dashboard_summary(machine_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if machine exists
    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    machine = cursor.fetchone()
    if not machine:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")

    # Fetch recent machine logs
    cursor.execute("""
        SELECT * FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
    """, (machine_id,))
    logs = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if not logs:
        # Fallback values if no logs recorded yet
        return DashboardResponse(
            machine_id=machine_id,
            operator_id="N/A",
            engine_hours=0.0,
            fuel_used=0.0,
            load_cycles=0,
            idle_time=0,
            safety_status="NORMAL",
            active_alerts=0,
            seatbelt_compliance=100.0,
            anomaly_status="NORMAL",
            recent_alerts=[],
            recent_records=[]
        )

    latest = logs[0]
    safety_eval = evaluate_machine_safety(machine_id)
    anomaly_eval = detect_machine_anomaly(machine_id)

    seatbelt_pct = safety_eval["seatbelt_compliance"]["compliance_percentage"]
    active_alert_count = len(safety_eval["active_alerts"])
    anomaly_status = "ANOMALY" if anomaly_eval["anomaly"] else "NORMAL"

    return DashboardResponse(
        machine_id=machine_id,
        operator_id=latest["operator_id"],
        engine_hours=latest["engine_hours"],
        fuel_used=latest["fuel_used"],
        load_cycles=latest["load_cycles"],
        idle_time=latest["idling_time"],
        safety_status=safety_eval["safety_status"],
        active_alerts=active_alert_count,
        seatbelt_compliance=seatbelt_pct,
        anomaly_status=anomaly_status,
        recent_alerts=safety_eval["active_alerts"],
        recent_records=logs
    )
