import json
import pathlib
import sys
from datetime import datetime

import joblib

BASE_DIR = pathlib.Path(__file__).resolve().parent
MODELS_PATH = BASE_DIR / "pharmacy_models.pkl"


def main() -> None:
    if len(sys.argv) > 1:
        try:
            month = int(sys.argv[1])
        except ValueError:
            month = datetime.now().month
    else:
        month = datetime.now().month

    if not MODELS_PATH.exists():
        raise SystemExit("MODEL_NOT_FOUND")

    loaded = joblib.load(MODELS_PATH)

    # Backwards compatibility: older models were stored as a simple dict[id -> model]
    if isinstance(loaded, dict) and "models" in loaded:
        models = loaded.get("models", {})
        names = loaded.get("names", {}) or {}
        confidences = loaded.get("confidences", {}) or {}
    else:
        models = loaded
        names = {}
        confidences = {}

    results: list[dict] = []
    for medicine_id, model in models.items():
        try:
            pred = model.predict([[month]])
            prediction = int(round(float(pred[0])))
        except Exception:
            continue

        # Use precomputed validation confidence when available
        confidence = float(confidences.get(str(medicine_id), 0.0))
        name = names.get(str(medicine_id))

        results.append({
            "medicineId": str(medicine_id),
            "predictedDemand": prediction,
            "confidence": round(confidence, 2),
            "medicineName": name,
        })

    print(json.dumps(results))


if __name__ == "__main__":
    main()
