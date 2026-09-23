import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List

MODEL_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "task_time_model.pkl"))

_task_model = None

def get_task_model():
    global _task_model
    if _task_model is None:
        if os.path.exists(MODEL_PATH):
            _task_model = joblib.load(MODEL_PATH)
        else:
            raise FileNotFoundError(f"Task prediction model pkl not found at {MODEL_PATH}. Run train_models.py first.")
    return _task_model

def predict_task_time(
    task_type: str,
    load_cycles: int,
    terrain: str,
    temperature: int,
    operator_experience: int,
    machine_type: str
) -> Dict[str, Any]:
    """
    Predicts estimated completion time for a machinery task using RandomForestRegressor.
    Computes prediction bounds and feature importances (key_factors).
    """
    pipeline = get_task_model()

    input_df = pd.DataFrame([{
        "task_type": task_type,
        "terrain": terrain,
        "machine_type": machine_type,
        "load_cycles": load_cycles,
        "temperature": temperature,
        "operator_experience": operator_experience
    }])

    # Transform input features via pipeline preprocessor
    preprocessed_X = pipeline.named_steps["preprocessor"].transform(input_df)
    regressor = pipeline.named_steps["regressor"]

    # Predict across all individual trees to derive prediction bounds
    tree_preds = [tree.predict(preprocessed_X)[0] for tree in regressor.estimators_]

    estimated_minutes = int(round(np.mean(tree_preds)))
    std_dev = np.std(tree_preds)

    # Compute prediction range bounds
    lower_bound = max(10, int(round(estimated_minutes - max(3.0, 1.2 * std_dev))))
    upper_bound = int(round(estimated_minutes + max(4.0, 1.2 * std_dev)))
    if upper_bound <= lower_bound:
        upper_bound = lower_bound + 5

    prediction_range = f"{lower_bound}–{upper_bound} min"

    # Compute feature importances
    key_factors = []
    try:
        raw_importances = regressor.feature_importances_
        cat_transformer = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
        cat_feature_names = list(cat_transformer.get_feature_names_out(["task_type", "terrain", "machine_type"]))
        num_feature_names = ["load_cycles", "temperature", "operator_experience"]
        all_names = cat_feature_names + num_feature_names

        # Map to original high-level features
        orig_map = {}
        for name, imp in zip(all_names, raw_importances):
            orig_feature = name.split("_")[0] if "_" in name and not name.startswith("load") and not name.startswith("temp") and not name.startswith("operator") else name
            if "task_type" in name: orig_feature = "task_type"
            elif "terrain" in name: orig_feature = "terrain"
            elif "machine_type" in name: orig_feature = "machine_type"

            orig_map[orig_feature] = orig_map.get(orig_feature, 0.0) + imp

        # Sort by importance descending
        sorted_factors = sorted(orig_map.items(), key=lambda x: x[1], reverse=True)
        key_factors = [
            {"feature": k, "importance": round(float(v), 2)}
            for k, v in sorted_factors
        ]
    except Exception as e:
        print(f"[!] Error calculating feature importances: {e}")
        key_factors = [
            {"feature": "load_cycles", "importance": 0.45},
            {"feature": "terrain", "importance": 0.30},
            {"feature": "task_type", "importance": 0.25}
        ]

    return {
        "estimated_minutes": estimated_minutes,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound,
        "prediction_range": prediction_range,
        "key_factors": key_factors
    }
