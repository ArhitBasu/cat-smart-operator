from fastapi import APIRouter, HTTPException
from app.schemas import SafetyResponse
from app.database import get_db_connection
from app.services.safety_engine import evaluate_machine_safety

router = APIRouter(prefix="/api/safety", tags=["Safety Engine"])

@router.get("/{machine_id}", response_model=SafetyResponse, description="Fetch detailed safety engine status, violations, and seatbelt compliance")
def get_safety_status(machine_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    conn.close()

    safety_data = evaluate_machine_safety(machine_id)
    return SafetyResponse(**safety_data)
