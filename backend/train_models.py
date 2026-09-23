import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

from app.utils.data_generator import generate_synthetic_data

def train_and_save_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print("[*] Generating / refreshing synthetic dataset...")
    df, _, _, _, _ = generate_synthetic_data(data_dir)

    # -------------------------------------------------------------
    # 1. Train Anomaly Detection Model (IsolationForest)
    # -------------------------------------------------------------
    print("[*] Training IsolationForest anomaly detection model...")
    anomaly_features = ["engine_hours", "fuel_used", "load_cycles", "idling_time"]
    X_anomaly = df[anomaly_features]

    isolation_forest = IsolationForest(
        n_estimators=100,
        contamination=0.08,
        random_state=42
    )
    isolation_forest.fit(X_anomaly)

    anomaly_model_path = os.path.join(models_dir, "anomaly_model.pkl")
    joblib.dump(isolation_forest, anomaly_model_path)
    print(f"[+] IsolationForest model saved to {anomaly_model_path}")

    # -------------------------------------------------------------
    # 2. Train Task Completion Time Model (RandomForestRegressor)
    # -------------------------------------------------------------
    print("[*] Training RandomForestRegressor task completion time model...")
    categorical_features = ["task_type", "terrain", "machine_type"]
    numeric_features = ["load_cycles", "temperature", "operator_experience"]
    target = "task_completion_time"

    X_task = df[categorical_features + numeric_features]
    y_task = df[target]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numeric_features)
        ]
    )

    regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )

    task_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", regressor)
    ])

    task_pipeline.fit(X_task, y_task)

    task_model_path = os.path.join(models_dir, "task_time_model.pkl")
    joblib.dump(task_pipeline, task_model_path)
    print(f"[+] Task time prediction model saved to {task_model_path}")
    print("[+] Model training completed successfully!")

if __name__ == "__main__":
    train_and_save_models()
