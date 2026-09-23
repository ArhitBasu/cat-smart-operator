from fastapi import APIRouter, HTTPException
from app.schemas import TaskPredictionRequest, TaskPredictionResponse
from app.services.task_predictor import predict_task_time

router = APIRouter(prefix="/api/task", tags=["Task Prediction"])

@router.post("/predict", response_model=TaskPredictionResponse, description="Estimate task completion time using RandomForestRegressor")
def estimate_task_time(req: TaskPredictionRequest):
    try:
        result = predict_task_time(
            task_type=req.task_type,
            load_cycles=req.load_cycles,
            terrain=req.terrain,
            temperature=req.temperature,
            operator_experience=req.operator_experience,
            machine_type=req.machine_type
        )
        return TaskPredictionResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process task prediction: {str(e)}")
