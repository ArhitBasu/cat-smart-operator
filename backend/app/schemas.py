from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- 1. Machine List Schemas ---
class MachineItem(BaseModel):
    machine_id: str = Field(..., example="EXC001")
    machine_type: str = Field(..., example="Excavator")
    status: str = Field(..., example="ONLINE")

class MachineListResponse(BaseModel):
    machines: List[MachineItem]

# --- 2. Dashboard Schemas ---
class DashboardResponse(BaseModel):
    machine_id: str
    operator_id: str
    engine_hours: float
    fuel_used: float
    load_cycles: int
    idle_time: int
    safety_status: str
    active_alerts: int
    seatbelt_compliance: float
    anomaly_status: str
    recent_alerts: List[Dict[str, Any]]
    recent_records: List[Dict[str, Any]]

# --- 3. Safety Schemas ---
class SafetyAlertItem(BaseModel):
    severity: str
    alert_type: str
    message: str
    recommendation: str

class SeatbeltComplianceDetail(BaseModel):
    total_records: int
    fastened_count: int
    unfastened_count: int
    compliance_percentage: float
    operator_compliance: Dict[str, float]
    machine_compliance: Dict[str, float]

class SafetyResponse(BaseModel):
    machine_id: str
    operator_id: str
    risk_level: str
    safety_status: str
    seatbelt_compliance: SeatbeltComplianceDetail
    active_alerts: List[SafetyAlertItem]
    recent_violations: List[Dict[str, Any]]
    recommendations: List[str]

# --- 4. Analytics Schemas ---
class TimeSeriesPoint(BaseModel):
    timestamp: str
    value: float

class AnalyticsResponse(BaseModel):
    machine_id: str
    fuel: List[TimeSeriesPoint]
    idle_time: List[TimeSeriesPoint]
    load_cycles: List[TimeSeriesPoint]
    engine_hours: List[TimeSeriesPoint]
    seatbelt_status: List[Dict[str, Any]]
    safety_alerts: List[Dict[str, Any]]

# --- 5. Anomaly Schemas ---
class AnomalyResponse(BaseModel):
    machine_id: str
    anomaly: bool
    severity: Optional[str] = "LOW"
    anomaly_score: float
    reason: str
    contributing_factors: Optional[List[Dict[str, Any]]] = None
    recommendation: Optional[str] = None
    anomaly_details: List[str]

# --- 6. Task Time Prediction Schemas ---
class TaskPredictionRequest(BaseModel):
    task_type: str = Field(..., example="Excavation")
    load_cycles: int = Field(..., example=20)
    terrain: str = Field(..., example="Hard Clay")
    temperature: int = Field(..., example=32)
    operator_experience: int = Field(..., example=3)
    machine_type: str = Field(..., example="Excavator")

class TaskPredictionResponse(BaseModel):
    estimated_minutes: int
    lower_bound: int
    upper_bound: int
    prediction_range: str
    key_factors: Optional[List[Dict[str, Any]]] = None

# --- 7. Incident Schemas ---
class IncidentCreate(BaseModel):
    machine_id: str
    operator_id: str
    type: str
    severity: str
    description: str

class IncidentStatusUpdate(BaseModel):
    status: str

class IncidentResponse(BaseModel):
    id: str
    timestamp: str
    machine_id: str
    operator_id: str
    type: str
    severity: str
    description: str
    status: str

# --- 8. Training Schemas ---
class TrainingModuleItem(BaseModel):
    id: str
    title: str
    description: str
    duration: str
    category: str
    completion_percentage: int
    recommended: bool

class TrainingResponse(BaseModel):
    modules: List[TrainingModuleItem]
    recommended_module_ids: List[str]
    recommendation_reasons: List[str]

# --- 9. AI Assistant Schemas ---
class AssistantRequest(BaseModel):
    machine_id: str = Field(..., example="EXC001")
    operator_id: Optional[str] = Field(None, example="OP1001")
    message: str = Field(..., example="Why did I receive a safety alert?")

class AssistantResponse(BaseModel):
    answer: str
    recommendations: List[str]
    context_used: Dict[str, Any]

# --- 10. Machine Intelligence Schemas ---
class MachineIntelligenceResponse(BaseModel):
    machine_id: str
    overall_risk: int = Field(..., description="0-100 score where HIGHER IS WORSE")
    risk_level: str
    safety_score: int = Field(..., description="0-100 score where HIGHER IS BETTER")
    efficiency_score: int = Field(..., description="0-100 score where HIGHER IS BETTER")
    machine_health_score: int = Field(..., description="0-100 score where HIGHER IS BETTER")
    operator_safety_score: int = Field(..., description="0-100 score where HIGHER IS BETTER")
    key_findings: List[str]
    trends: List[Dict[str, Any]]
    recommended_actions: List[str]
    score_semantics: Optional[Dict[str, str]] = None

# --- 11. Alert Explanation Schemas ---
class AlertExplanationRequest(BaseModel):
    machine_id: str = Field(..., example="EXC001")
    alert_id: Optional[str] = Field(None, example="optional-alert-id")

class AlertExplanationResponse(BaseModel):
    alert: str
    severity: str
    why: str
    evidence: List[str]
    recommendations: List[str]

