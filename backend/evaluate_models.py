import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

def evaluate_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "data", "machinery.csv")
    model_path = os.path.join(base_dir, "models", "task_time_model.pkl")

    if not os.path.exists(csv_path) or not os.path.exists(model_path):
        print("[!] Data or model files not found. Run train_models.py first.")
        return

    df = pd.read_csv(csv_path)
    pipeline = joblib.load(model_path)

    categorical_features = ["task_type", "terrain", "machine_type"]
    numeric_features = ["load_cycles", "temperature", "operator_experience"]
    target = "task_completion_time"

    X = df[categorical_features + numeric_features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    preds = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    print("\n==================================================")
    print("TASK TIME MODEL REGRESSION EVALUATION METRICS")
    print("==================================================")
    print(f"Mean Absolute Error (MAE)  : {mae:.2f} minutes")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} minutes")
    print(f"R-squared Score (R²)       : {r2:.4f}")
    print("==================================================\n")

if __name__ == "__main__":
    evaluate_models()
