import os
import pathlib

import pandas as pd
from pymongo import MongoClient

BASE_DIR = pathlib.Path(__file__).resolve().parent


def get_mongo_uri() -> str:
    uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if not uri:
        # Fallback to a sensible local default if env var not set
        return "mongodb://localhost:27017/pharmacy"
    return uri


def main() -> None:
    uri = get_mongo_uri()
    client = MongoClient(uri)

    # If URI does not include DB name, default to "pharmacy"
    if client.address is None:
        db = client["pharmacy"]
    else:
        # Use default database from URI if present, else fallback
        db_name = client.get_database().name or "pharmacy"
        db = client[db_name]

    # Fetch medicines with their categories and names
    medicines_cursor = db["medicines"].find({}, {"_id": 1, "name": 1, "category": 1})
    medicine_map = {}
    for med in medicines_cursor:
        med_id = str(med.get("_id"))
        medicine_map[med_id] = {
            "name": med.get("name", "Unknown"),
            "category": med.get("category", "General")
        }

    ledger_cursor = db["stockledgers"].find({"type": "SALE"})

    data = []
    for entry in ledger_cursor:
        medicine_id = entry.get("medicineId")
        created_at = entry.get("createdAt")
        quantity = entry.get("quantity")
        if medicine_id is None or created_at is None or quantity is None:
            continue

        med_id_str = str(medicine_id)
        med_info = medicine_map.get(med_id_str, {"name": "Unknown", "category": "General"})

        data.append({
            "medicineId": med_id_str,
            "medicineName": med_info["name"],
            "category": med_info["category"],
            "date": created_at,
            "quantity": abs(quantity),
        })

    if not data:
        raise SystemExit("No SALE entries found in stockledgers; cannot build training data")

    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "quantity"])

    if df.empty:
        raise SystemExit("Training dataframe is empty after cleaning; check ledger data")

    df["month"] = df["date"].dt.month

    output_path = BASE_DIR / "training_data.csv"
    df.to_csv(output_path, index=False)

    print(f"Training data extracted successfully to {output_path}")
    print(f"Extracted {len(df)} records for {df['medicineId'].nunique()} unique medicines")


if __name__ == "__main__":
    main()
