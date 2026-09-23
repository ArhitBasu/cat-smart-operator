from typing import List, Optional
from fastapi import APIRouter, Query
from app.schemas import TrainingResponse, TrainingModuleItem
from app.database import get_db_connection
from app.services.safety_engine import evaluate_machine_safety

router = APIRouter(prefix="/api/training", tags=["Operator Training Hub"])

@router.get("", response_model=TrainingResponse, description="Fetch training modules and dynamic recommendations based on safety violations")
def get_training_modules(machine_id: Optional[str] = Query(None, description="Optional machine_id to customize training recommendations")):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM training_modules ORDER BY id ASC")
    rows = cursor.fetchall()
    modules = [TrainingModuleItem(**dict(r)) for r in rows]

    recommended_ids = []
    reasons = []

    if machine_id:
        cursor.execute("SELECT * FROM machines WHERE machine_id = ?", (machine_id,))
        if cursor.fetchone():
            safety = evaluate_machine_safety(machine_id)
            for alert in safety.get("active_alerts", []):
                if alert["alert_type"] == "SEATBELT":
                    recommended_ids.append("TRN-01")
                    reasons.append("Active seatbelt violation detected -> Recommended: Seatbelt Safety & Protocols")
                elif alert["alert_type"] == "IDLE":
                    recommended_ids.append("TRN-03")
                    reasons.append("Excessive engine idling detected -> Recommended: Fuel Efficiency & Idle Management")
                elif alert["alert_type"] == "UNSAFE_OPERATION":
                    recommended_ids.append("TRN-02")
                    reasons.append("Unsafe operation pattern detected -> Recommended: Excavator Safe Operation")

    # Fleet-wide default fallback recommendations if no specific machine provided
    if not recommended_ids:
        # Recommend modules with < 50% completion or marked recommended
        recommended_ids = [m.id for m in modules if m.completion_percentage < 50 or m.recommended]
        reasons.append("Recommended based on operator fleet compliance and low completion modules.")

    recommended_ids = list(dict.fromkeys(recommended_ids))

    # Mark modules as recommended in output
    for m in modules:
        if m.id in recommended_ids:
            m.recommended = True

    conn.close()

    return TrainingResponse(
        modules=modules,
        recommended_module_ids=recommended_ids,
        recommendation_reasons=reasons
    )
