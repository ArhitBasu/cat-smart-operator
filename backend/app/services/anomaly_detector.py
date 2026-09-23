import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.database import get_db_connection
from app.services.baseline_engine import calculate_machine_baseline

MODEL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "anomaly_model.pkl"))

_anomaly_model = None

def get_anomaly_model():
    global _anomaly_model
    if _anomaly_model is None:
        if os.path.exists(MODEL_PATH):
            _anomaly_model = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(f"Anomaly model pkl file not found at {MODEL_PATH}. Run train_models.py first.")
    return _anomaly_model

def detect_machine_anomaly(machine_id: str) -> Dict[str, Any]:
    """
    Evaluates latest telemetry for a machine using IsolationForest + domain-specific analysis.
    Computes contributing factors with actual values, expected historical averages, and deviation percentages.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT engine_hours, fuel_used, load_cycles, idling_time, timestamp
        FROM machine_logs
        WHERE machine_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (machine_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {
            "machine_id": machine_id,
            "anomaly": False,
            "severity": "LOW",
            "anomaly_score": 0.0,
            "reason": "No telemetry data found for machine.",
            "contributing_factors": [],
            "recommendation": "Maintain standard monitoring protocols.",
            "anomaly_details": []
        }

    log = dict(row)
    features_df = pd.DataFrame([{
        "engine_hours": log["engine_hours"],
        "fuel_used": log["fuel_used"],
        "load_cycles": log["load_cycles"],
        "idling_time": log["idling_time"]
    }])

    model = get_anomaly_model()
    prediction = model.predict(features_df)[0]
    score = round(float(model.score_samples(features_df)[0]), 3)

    is_anomaly = (prediction == -1)

    # Fetch machine historical baseline for expected values
    baseline = calculate_machine_baseline(machine_id)
    contributing_factors = []
    details = []

    if baseline:
        # Check fuel_used factor
        exp_fuel = baseline.get("fuel_used", {}).get("mean", 5.0)
        fuel_val = log["fuel_used"]
        fuel_dev = round(((fuel_val - exp_fuel) / exp_fuel * 100), 1) if exp_fuel > 0 else 0.0
        if abs(fuel_dev) > 30.0:
            contributing_factors.append({
                "feature": "fuel_used",
                "value": fuel_val,
                "expected": exp_fuel,
                "deviation_percent": fuel_dev
            })

        # Check idling_time factor
        exp_idle = baseline.get("idling_time", {}).get("mean", 25.0)
        idle_val = log["idling_time"]
        idle_dev = round(((idle_val - exp_idle) / exp_idle * 100), 1) if exp_idle > 0 else 0.0
        if abs(idle_dev) > 30.0:
            contributing_factors.append({
                "feature": "idling_time",
                "value": idle_val,
                "expected": exp_idle,
                "deviation_percent": idle_dev
            })

        # Check load_cycles factor
        exp_cycles = baseline.get("load_cycles", {}).get("mean", 10.0)
        cycles_val = log["load_cycles"]
        cycles_dev = round(((cycles_val - exp_cycles) / exp_cycles * 100), 1) if exp_cycles > 0 else 0.0
        if abs(cycles_dev) > 40.0:
            contributing_factors.append({
                "feature": "load_cycles",
                "value": cycles_val,
                "expected": exp_cycles,
                "deviation_percent": cycles_dev
            })

    # Formulate domain reason & severity
    if is_anomaly or len(contributing_factors) >= 2:
        is_anomaly = True
        severity = "HIGH" if (log["idling_time"] >= 60 or log["fuel_used"] > 12.0) else "MEDIUM"
        
        reasons_list = []
        if log["idling_time"] >= 50:
            reasons_list.append("Excessive engine idling")
        if log["fuel_used"] > 10.0 and log["load_cycles"] <= 3:
            reasons_list.append("Abnormal fuel consumption relative to load")
        elif log["fuel_used"] > 12.0:
            reasons_list.append("Abnormal fuel usage spike")
        if not reasons_list:
            reasons_list.append("Unusual operational feature distribution")

        reason = " and ".join(reasons_list)
        recommendation = "Inspect operating conditions, engine idle parameters, and fuel consumption."
    else:
        severity = "LOW"
        reason = "Normal operating pattern"
        recommendation = "Machine operating within standard statistical parameters."

    details = [f"{c['feature']}: {c['value']} vs expected {c['expected']} ({c['deviation_percent']}%)" for c in contributing_factors]

    return {
        "machine_id": machine_id,
        "anomaly": is_anomaly,
        "severity": severity,
        "anomaly_score": score,
        "reason": reason,
        "contributing_factors": contributing_factors,
        "recommendation": recommendation,
        "anomaly_details": details
    }
