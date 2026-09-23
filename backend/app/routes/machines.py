from fastapi import APIRouter, HTTPException
from app.schemas import MachineListResponse, MachineItem
from app.database import get_db_connection

router = APIRouter(prefix="/api/machines", tags=["Machines"])

@router.get("", response_model=MachineListResponse, description="Returns all registered Caterpillar machines with status")
def get_all_machines():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT machine_id, machine_type, status FROM machines ORDER BY machine_id ASC")
    rows = cursor.fetchall()
    conn.close()

    machines = [
        MachineItem(
            machine_id=r["machine_id"],
            machine_type=r["machine_type"],
            status=r["status"]
        ) for r in rows
    ]

    return MachineListResponse(machines=machines)
