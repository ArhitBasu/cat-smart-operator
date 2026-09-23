from fastapi import APIRouter, HTTPException
from app.schemas import MachineIntelligenceResponse
from app.database import get_db_connection
from app.services.machine_intelligence import compute_machine_intelligence

router = APIRouter(prefix="/api/machine-intelligence", tags=["Machine Intelligence Engine"])

@router.get("/{machine_id}", response_model=MachineIntelligenceResponse, description="Fetch unified machine intelligence scores, risk level, key findings, and recommended actions")
def get_machine_intelligence_summary(machine_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found")
    conn.close()

    data = compute_machine_intelligence(machine_id)
    return MachineIntelligenceResponse(**data)
