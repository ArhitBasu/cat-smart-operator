from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from app.schemas import IncidentResponse, IncidentCreate, IncidentStatusUpdate
from app.database import get_db_connection

router = APIRouter(prefix="/api/incidents", tags=["Incident Management"])

@router.get("", response_model=List[IncidentResponse], description="List reported machinery safety incidents")
def get_incidents(machine_id: str = Query(None, description="Optional filter by machine_id")):
    conn = get_db_connection()
    cursor = conn.cursor()

    if machine_id:
        cursor.execute("SELECT * FROM incidents WHERE machine_id = ? ORDER BY timestamp DESC", (machine_id,))
    else:
        cursor.execute("SELECT * FROM incidents ORDER BY timestamp DESC")

    rows = cursor.fetchall()
    conn.close()

    return [IncidentResponse(**dict(r)) for r in rows]

@router.post("", response_model=IncidentResponse, status_code=201, description="Create a new machinery safety incident report")
def create_incident(req: IncidentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Validate machine existence
    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (req.machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid machine_id '{req.machine_id}'. Machine does not exist.")

    # Validate severity
    valid_severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    if req.severity.upper() not in valid_severities:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid severity '{req.severity}'. Must be one of {valid_severities}")

    incident_id = f"INC-{int(datetime.now().timestamp())}"
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "OPEN"

    cursor.execute("""
        INSERT INTO incidents (id, timestamp, machine_id, operator_id, type, severity, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (incident_id, timestamp_str, req.machine_id, req.operator_id, req.type, req.severity.upper(), req.description, status))

    conn.commit()
    conn.close()

    return IncidentResponse(
        id=incident_id,
        timestamp=timestamp_str,
        machine_id=req.machine_id,
        operator_id=req.operator_id,
        type=req.type,
        severity=req.severity.upper(),
        description=req.description,
        status=status
    )
