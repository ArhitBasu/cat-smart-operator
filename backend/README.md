# CAT Smart Operator Assistant - Machine Intelligence & Decision Engine

## Project Overview
The **CAT Smart Operator Assistant** backend is a Machine Intelligence & Decision Engine designed for Caterpillar heavy machinery. It transforms raw telemetry data into actionable intelligence following the pipeline:

$$\text{DETECT} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXPLAIN} \longrightarrow \text{ASSESS RISK} \longrightarrow \text{RECOMMEND} \longrightarrow \text{TRAIN} \longrightarrow \text{AI ASSIST}$$

---

## Team Roles
- **Backend / AI / ML Lead**: Arhit Basu
- **Frontend Lead**: Tiyas (React + Vite + Tailwind CSS)

---

## Machine Intelligence Architecture & Scoring Semantics

### Standardized Score Semantics
- **`overall_risk`** (`0–100`): **HIGHER IS WORSE** ($0 = \text{Low Risk}$, $100 = \text{Critical Risk}$).
- **`safety_score`** (`0–100`): **HIGHER IS BETTER** ($100 = \text{Strong Safety}$).
- **`efficiency_score`** (`0–100`): **HIGHER IS BETTER** ($100 = \text{Optimal Efficiency}$).
- **`machine_health_score`** (`0–100`): **HIGHER IS BETTER** ($100 = \text{Healthy Machinery}$).
- **`operator_safety_score`** (`0–100`): **HIGHER IS BETTER** ($100 = \text{Strong Operator Compliance}$).

### Transparent Overall Risk Calculation Formula
$$\text{Overall Risk} = \text{Safety Risk}(30\%) + \text{Anomaly Risk}(25\%) + \text{Efficiency Risk}(20\%) + \text{Health Risk}(15\%) + \text{Trend Risk}(10\%)$$
- **`0 - 19`**: `LOW`
- **`20 - 44`**: `MEDIUM`
- **`45 - 69`**: `HIGH`
- **`70 - 100`**: `CRITICAL`

---

## System Components

1. **Historical Baseline Engine (`app/services/baseline_engine.py`)**:
   - Calculates statistical metrics (`mean`, `median`, `std_dev`, `min`, `max`) per machine and fleet-wide.
   - Computes deviation percentages (`deviation_percent`) and `z_score`.

2. **Trend Analysis Engine (`app/services/trend_engine.py`)**:
   - Analyzes recent 5 telemetry logs against historical baselines to track metric direction (`INCREASING`, `DECREASING`, `STABLE`).

3. **Explainable Anomaly Detector (`app/services/anomaly_detector.py`)**:
   - Combines IsolationForest machine learning with domain-specific rule analysis.
   - Identifies contributing factors comparing actual telemetry values against historical expectations.

4. **Recommendation Engine (`app/services/recommendation_engine.py`)**:
   - Transforms safety events, idling trends, and ML anomalies into structured action items linked directly to operator training modules.

5. **Machine Intelligence Engine (`app/services/machine_intelligence.py`)**:
   - Computes unified risk indicators, positive 0-100 sub-scores, key findings, and recommended actions.

6. **Signature "Why?" Alert Explanation Engine (`app/services/assistant.py`)**:
   - Provides evidence-backed explanations for safety alerts based on database facts without inventing telemetry.

7. **Task Time Predictor (`app/services/task_predictor.py`)**:
   - RandomForestRegressor model providing completion time predictions, estimation bounds (`lower_bound`, `upper_bound`, `prediction_range`), and feature importance breakdown (`key_factors`).

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS middleware & route registries
│   ├── database.py             # Idempotent SQLite database connection & seeder
│   ├── schemas.py              # Pydantic v2 schemas for all API payloads
│   │
│   ├── routes/
│   │   ├── machines.py         # GET /api/machines
│   │   ├── dashboard.py        # GET /api/dashboard/{machine_id}
│   │   ├── safety.py           # GET /api/safety/{machine_id}
│   │   ├── analytics.py        # GET /api/analytics/{machine_id}
│   │   ├── anomalies.py        # GET /api/anomalies/{machine_id}
│   │   ├── machine_intelligence.py # GET /api/machine-intelligence/{machine_id} [NEW]
│   │   ├── prediction.py       # POST /api/task/predict
│   │   ├── incidents.py        # GET & POST /api/incidents
│   │   ├── training.py         # GET /api/training
│   │   └── assistant.py        # POST /api/assistant & POST /api/assistant/explain-alert [UPDATED]
│   │
│   ├── services/
│   │   ├── safety_engine.py    # Rule-based safety & compliance calculations
│   │   ├── baseline_engine.py  # Historical statistical baseline engine [NEW]
│   │   ├── trend_engine.py     # Metric directional trend analyzer [NEW]
│   │   ├── anomaly_detector.py # IsolationForest scoring & contributing factors
│   │   ├── recommendation_engine.py # Structured recommendation generator [NEW]
│   │   ├── machine_intelligence.py  # Unified risk scoring & decision engine [NEW]
│   │   ├── task_predictor.py   # RandomForest task estimation & key factors
│   │   └── assistant.py        # Hybrid LLM / Factual fallback AI logic & Alert Explanation
│   │
│   └── utils/
│       └── data_generator.py  # Synthetic telemetry generator (deterministic EXC001 seed=42)
│
├── data/
│   ├── machinery.csv           # Telemetry dataset
│   ├── incidents.json          # Initial incidents catalog
│   └── training.json           # Operator training modules catalog
│
├── models/
│   ├── anomaly_model.pkl       # IsolationForest model
│   └── task_time_model.pkl     # RandomForestRegressor model pipeline
│
├── train_models.py             # Data generator runner & model training script
├── evaluate_models.py          # Regression evaluation script (MAE, RMSE, R²) [NEW]
├── test_backend.py             # Comprehensive API test suite
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md                   # System documentation
```

---

## Setup & Execution Commands

### 1. Environment Setup & Model Training
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_models.py
```

### 2. Run Test Suite & Evaluation
```bash
python test_backend.py
python evaluate_models.py
```

### 3. Launch Backend API Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI Documentation: **`http://localhost:8000/docs`**

---

## API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health status check |
| `GET` | `/api/machines` | List machines for frontend dropdown selector |
| `GET` | `/api/dashboard/{machine_id}` | Machine summary dashboard |
| `GET` | `/api/safety/{machine_id}` | Active safety alerts & seatbelt compliance |
| `GET` | `/api/analytics/{machine_id}` | Recharts-formatted time-series arrays |
| `GET` | `/api/anomalies/{machine_id}` | IsolationForest anomaly analysis & contributing factors |
| `GET` | `/api/machine-intelligence/{machine_id}` | **NEW**: Unified risk, 0-100 sub-scores, findings & recommendations |
| `POST` | `/api/task/predict` | Estimates task time, range, and feature importances (`key_factors`) |
| `GET` | `/api/incidents` | List safety incidents |
| `POST` | `/api/incidents` | Create safety incident report |
| `GET` | `/api/training` | Training modules & dynamic recommendations |
| `POST` | `/api/assistant` | Query AI Operator Assistant |
| `POST` | `/api/assistant/explain-alert` | **NEW**: Signature 'Why?' alert explanation engine |

---

## Integration Guide for Tiyas (React Frontend)

### Base URL
`http://localhost:8000`

### 1. Unified Machine Intelligence Dashboard Widget
```javascript
const res = await fetch("http://localhost:8000/api/machine-intelligence/EXC001");
const intel = await res.json();
// intel.overall_risk -> 72 (HIGHER IS WORSE)
// intel.risk_level -> "HIGH"
// intel.safety_score -> 85 (HIGHER IS BETTER)
// intel.efficiency_score -> 61 (HIGHER IS BETTER)
// intel.machine_health_score -> 78 (HIGHER IS BETTER)
// intel.operator_safety_score -> 70 (HIGHER IS BETTER)
// intel.key_findings -> ["Idle time is significantly above historical baseline (+170.8% deviation).", ...]
// intel.recommended_actions -> ["Secure seatbelt restraint immediately...", ...]
```

### 2. Signature "Why?" Alert Explanation Component
```javascript
const res = await fetch("http://localhost:8000/api/assistant/explain-alert", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ machine_id: "EXC001" })
});
const data = await res.json();
// data.alert -> "Safety Alert & Operational Violation"
// data.why -> "EXC001 recorded a seatbelt violation, and excessive engine idle time (65 mins)."
// data.evidence -> ["Seatbelt: Unfastened", "Idle time: 65 minutes", "Historical average: 24.0 minutes", "Deviation: +170.8%"]
// data.recommendations -> ["Review operator safety procedure", ...]
```
