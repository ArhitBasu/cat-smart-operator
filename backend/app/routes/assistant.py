from fastapi import APIRouter, HTTPException
from app.schemas import AssistantRequest, AssistantResponse, AlertExplanationRequest, AlertExplanationResponse
from app.services.assistant import query_operator_assistant, explain_machine_alert

router = APIRouter(prefix="/api/assistant", tags=["AI Operator Assistant"])

@router.post("", response_model=AssistantResponse, description="AI-powered operator assistant for telemetry and safety query explanations")
def ask_assistant(req: AssistantRequest):
    if not req.machine_id or not req.machine_id.strip():
        raise HTTPException(status_code=400, detail="machine_id field is required")
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="message field is required")

    result = query_operator_assistant(
        machine_id=req.machine_id,
        operator_id=req.operator_id,
        message=req.message
    )
    return AssistantResponse(**result)

@router.post("/explain-alert", response_model=AlertExplanationResponse, description="Signature 'Why?' feature providing evidence-backed explanations for safety alerts")
def explain_alert_endpoint(req: AlertExplanationRequest):
    if not req.machine_id or not req.machine_id.strip():
        raise HTTPException(status_code=400, detail="machine_id field is required")

    result = explain_machine_alert(
        machine_id=req.machine_id,
        alert_id=req.alert_id
    )
    return AlertExplanationResponse(**result)
