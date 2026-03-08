import pathlib
from typing import Dict

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import joblib

BASE_DIR = pathlib.Path(__file__).resolve().parent
TRAINING_DATA_PATH = BASE_DIR / "training_data.csv"
MODELS_PATH = BASE_DIR / "pharmacy_models.pkl"


def main() -> None:
    if not TRAINING_DATA_PATH.exists():
        raise SystemExit(f"Training data not found at {TRAINING_DATA_PATH}. Run extract_from_mongo.py first.")

    df = pd.read_csv(TRAINING_DATA_PATH)

    # Support either explicit medicineId or just medicineName in custom datasets
    id_column = None
    if "medicineId" in df.columns:
        id_column = "medicineId"
    elif "medicineName" in df.columns:
        id_column = "medicineName"
        # Use medicineName as a stable identifier when no numeric ID is present
        df["medicineId"] = df["medicineName"].astype(str)
    else:
        raise SystemExit(
            "training_data.csv must contain either 'medicineId' or 'medicineName' plus 'month' and 'quantity' columns"
        )

    required_cols = {"medicineId", "month", "quantity"}
    if not required_cols.issubset(df.columns):
        raise SystemExit("training_data.csv must have 'medicineId', 'month', and 'quantity' columns")

    models: Dict[str, RandomForestRegressor] = {}
    names: Dict[str, str] = {}
    confidences: Dict[str, float] = {}

    for medicine in df["medicineId"].dropna().unique():
        med_data = df[df["medicineId"] == medicine]
        if med_data.empty:
            continue

        X = med_data[["month"]]
        y = med_data["quantity"].astype(float)
        if X.empty or y.empty:
            continue

        model = RandomForestRegressor(random_state=42, n_estimators=300)

        # Simple hold-out validation when we have enough data points
        if len(med_data) >= 8:
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
            model.fit(X_train, y_train)
            try:
                y_pred = model.predict(X_val)
                score = r2_score(y_val, y_pred)
            except Exception:
                score = 0.0
        else:
            model.fit(X, y)
            score = 0.0

        key = str(medicine)
        models[key] = model

        if "medicineName" in df.columns:
            # Take the most frequent name for this id
            most_common_name = (
                med_data["medicineName"].dropna().astype(str).mode().iloc[0]
                if not med_data["medicineName"].dropna().empty
                else str(medicine)
            )
            names[key] = most_common_name

        # Map validation R^2 into a 0–1 confidence band; clamp to avoid negatives
        confidences[key] = max(0.0, min(float(score), 1.0))

    if not models:
        raise SystemExit("No models were trained; check training data")

    payload = {"models": models, "names": names, "confidences": confidences}

    MODELS_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, MODELS_PATH)
    print(f"Multi-medicine models trained successfully and saved to {MODELS_PATH}")


if __name__ == "__main__":
    main()
