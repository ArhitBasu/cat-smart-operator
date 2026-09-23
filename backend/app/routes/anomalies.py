from fastapi import APIRouter, HTTPException
from app.schemas import AnomalyResponse
from app.database import get_db_connection
from app.services.anomaly_detector import detect_machine_anomaly

router = APIRouter(prefix="/api/anomalies", tags=["Anomaly Detection"])

@router.get("/{machine_id}", response_model=AnomalyResponse, description="Check latest telemetry for operational anomalies using IsolationForest")
def get_machine_anomaly(machine_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    conn.close()

    try:
        anomaly_data = detect_machine_anomaly(machine_id)
        return AnomalyResponse(**anomaly_data)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
