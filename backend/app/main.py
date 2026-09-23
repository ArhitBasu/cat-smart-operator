import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import init_db
from app.routes import (
    machines,
    dashboard,
    safety,
    analytics,
    anomalies,
    prediction,
    incidents,
    training,
    assistant,
    machine_intelligence
)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform idempotent database initialization on startup
    print("[*] Starting CAT Smart Operator Assistant Backend...")
    init_db()
    yield
    print("[*] Shutting down CAT Smart Operator Assistant Backend...")

app = FastAPI(
    title="CAT Smart Operator Assistant API",
    description="Backend AI/ML & Telemetry Service for Caterpillar Machinery Hackathon MVP",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React frontend (Tiyas)
frontend_origins_str = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in frontend_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(machines.router)
app.include_router(dashboard.router)
app.include_router(safety.router)
app.include_router(analytics.router)
app.include_router(anomalies.router)
app.include_router(prediction.router)
app.include_router(incidents.router)
app.include_router(training.router)
app.include_router(assistant.router)
app.include_router(machine_intelligence.router)

@app.get("/health", tags=["Health"], description="Service health status check")
def health_check():
    return {
        "status": "healthy",
        "service": "CAT Smart Operator Assistant Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
