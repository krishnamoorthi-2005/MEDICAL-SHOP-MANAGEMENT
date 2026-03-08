import pathlib
import sys

# Check for required dependencies
try:
    import pandas as pd
except ImportError:
    print("[ERROR] pandas library is not installed")
    print("Please install it using: pip install pandas")
    sys.exit(1)

from typing import Dict

BASE_DIR = pathlib.Path(__file__).resolve().parent
TRAINING_DATA_PATH = BASE_DIR / "training_data.csv"


def categorize_medicine(medicine_name: str) -> str:
    """
    Intelligently categorize medicines based on their names.
    This is a fallback when category is not provided in the dataset.
    """
    name_lower = medicine_name.lower()
    
    # Fever & Pain
    if any(keyword in name_lower for keyword in ['paracetamol', 'ibuprofen', 'aspirin', 'acetaminophen', 'fever']):
        return 'Fever'
    
    # Antibiotics
    if any(keyword in name_lower for keyword in ['amox', 'azithro', 'cipro', 'antibiotic', 'cef', 'penicilin']):
        return 'Antibiotic'
    
    # Cold & Cough
    if any(keyword in name_lower for keyword in ['cough', 'cold', 'decongestant', 'loratadine', 'cetirizine']):
        return 'Cold/Cough'
    
    # Allergy
    if any(keyword in name_lower for keyword in ['allergy', 'antihistamine', 'allegra', 'zyrtec']):
        return 'Allergy'
    
    # Gastric & Digestive
    if any(keyword in name_lower for keyword in ['omeprazole', 'pantoprazole', 'antacid', 'gastric', 'ranitidine']):
        return 'Gastric'
    
    # Painkillers
    if any(keyword in name_lower for keyword in ['pain', 'analgesic', 'diclofenac', 'tramadol']):
        return 'Painkiller'
    
    # Vitamins & Supplements
    if any(keyword in name_lower for keyword in ['vitamin', 'supplement', 'calcium', 'iron', 'zinc', 'multivitamin']):
        return 'Vitamin'
    
    # Antifungal
    if any(keyword in name_lower for keyword in ['fungal', 'fluconazole', 'clotrimazole']):
        return 'Antifungal'
    
    # Antihistamine
    if any(keyword in name_lower for keyword in ['histamine', 'diphenhydramine']):
        return 'Antihistamine'
    
    # Default
    return 'General'


def validate_and_prepare_data() -> bool:
    """
    Validate the training data and ensure it has all required columns.
    Adds category column if missing using intelligent categorization.
    """
    
    if not TRAINING_DATA_PATH.exists():
        print(f"[ERROR] Training data not found at {TRAINING_DATA_PATH}")
        print("Please ensure training_data.csv exists with columns: medicineId, medicineName, month, quantity")
        return False
    
    try:
        # Read the CSV
        df = pd.read_csv(TRAINING_DATA_PATH)
        
        # Check for required columns
        required_cols = {'medicineId', 'medicineName', 'month', 'quantity'}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            print(f"[ERROR] Missing required columns: {missing}")
            return False
        
        # Add category column if it doesn't exist
        if 'category' not in df.columns:
            print("[INFO] Category column not found. Auto-categorizing medicines...")
            df['category'] = df['medicineName'].apply(categorize_medicine)
            
            # Save the enriched data back
            df.to_csv(TRAINING_DATA_PATH, index=False)
            print("[SUCCESS] Category column added successfully")
        
        # Validate data quality
        total_records = len(df)
        valid_records = df.dropna(subset=['medicineId', 'month', 'quantity']).shape[0]
        
        if valid_records < total_records * 0.8:
            print(f"[WARNING] {total_records - valid_records} records have missing data")
        
        # Show statistics
        unique_medicines = df['medicineId'].nunique()
        month_range = f"{int(df['month'].min())}-{int(df['month'].max())}"
        
        print(f"\n[STATS] Dataset Statistics:")
        print(f"   Total Records: {total_records}")
        print(f"   Unique Medicines: {unique_medicines}")
        print(f"   Month Range: {month_range}")
        print(f"   Categories: {df['category'].nunique()}")
        
        # Show category distribution
        print(f"\n[CATEGORIES] Category Distribution:")
        category_counts = df['category'].value_counts()
        for cat, count in category_counts.items():
            print(f"   {cat}: {count} records")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error processing training data: {e}")
        return False


def main() -> None:
    """
    Main entry point for the multi-agent training preparation.
    Unlike traditional ML models, the multi-agent system doesn't require
    actual training - it just needs properly formatted and categorized data.
    """
    
    print("Multi-Agent Prediction System - Data Preparation")
    print("=" * 60)
    
    success = validate_and_prepare_data()
    
    if success:
        print("\n[SUCCESS] Data preparation completed successfully!")
        print("The multi-agent system is ready to generate predictions.")
        print("\nTo test predictions, run:")
        print(f"   python predict_multiagent.py <month_number>")
    else:
        print("\n[ERROR] Data preparation failed. Please fix the issues above.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
