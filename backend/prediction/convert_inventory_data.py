"""
Converts aggregated inventory data to month-by-month historical format
for the multi-agent prediction system.

This script takes summary data (MedicineName, Category, AvgMonthlySales, CurrentStock)
and generates realistic historical sales data with seasonal variations.
"""

import pandas as pd
import random
from pathlib import Path

# Input and output paths
INPUT_FILE = Path(__file__).parent.parent.parent / 'train_data set' / 'medical_inventory.csv'
OUTPUT_FILE = Path(__file__).parent / 'training_data.csv'

# Seasonal variation factors for different categories
SEASONAL_PATTERNS = {
    'Cold/Cough': {
        1: 1.4, 2: 1.3, 3: 1.1, 4: 0.9, 5: 0.8, 6: 0.7,
        7: 0.8, 8: 0.9, 9: 1.0, 10: 1.2, 11: 1.3, 12: 1.4
    },
    'Fever': {
        1: 1.2, 2: 1.2, 3: 1.1, 4: 0.9, 5: 0.9, 6: 0.8,
        7: 0.9, 8: 1.0, 9: 1.0, 10: 1.1, 11: 1.2, 12: 1.2
    },
    'Allergy': {
        1: 0.8, 2: 0.9, 3: 1.2, 4: 1.3, 5: 1.2, 6: 1.0,
        7: 1.0, 8: 1.1, 9: 1.2, 10: 1.1, 11: 0.9, 12: 0.8
    },
    'Gastric': {
        1: 1.0, 2: 1.0, 3: 1.0, 4: 1.1, 5: 1.1, 6: 1.0,
        7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 1.0
    },
    # Default pattern for other categories
    'default': {
        1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0,
        7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 1.0
    }
}

def generate_monthly_sales(avg_sales: float, category: str, num_months: int = 12) -> list:
    """
    Generate realistic monthly sales data based on average and category.
    
    Args:
        avg_sales: Average monthly sales quantity
        category: Medicine category (for seasonal patterns)
        num_months: Number of months to generate (default 12 for 1 year)
    
    Returns:
        List of monthly sales quantities
    """
    pattern = SEASONAL_PATTERNS.get(category, SEASONAL_PATTERNS['default'])
    monthly_sales = []
    
    for month in range(1, num_months + 1):
        # Apply seasonal factor
        seasonal_factor = pattern.get(month, 1.0)
        
        # Add random variation (±15%)
        random_factor = random.uniform(0.85, 1.15)
        
        # Calculate quantity (ensure it's at least 0)
        quantity = max(0, int(avg_sales * seasonal_factor * random_factor))
        monthly_sales.append(quantity)
    
    return monthly_sales


def convert_inventory_to_training_data():
    """
    Main conversion function: reads aggregated data and generates historical format.
    """
    print("Multi-Agent Training Data Converter")
    print("=" * 60)
    
    # Check if input file exists
    if not INPUT_FILE.exists():
        print(f"[ERROR] Input file not found: {INPUT_FILE}")
        print("Please ensure medical_inventory.csv exists in the train_data set folder.")
        return False
    
    try:
        # Read the aggregated inventory data
        print(f"\n[INFO] Reading input file: {INPUT_FILE.name}")
        df_input = pd.read_csv(INPUT_FILE)
        
        # Validate columns
        required_cols = ['MedicineName', 'Category', 'AvgMonthlySales']
        if not all(col in df_input.columns for col in required_cols):
            print(f"[ERROR] Missing required columns. Expected: {required_cols}")
            print(f"Found: {list(df_input.columns)}")
            return False
        
        print(f"[INFO] Found {len(df_input)} medicines")
        
        # Generate historical data
        print("\n[INFO] Generating month-by-month historical data...")
        historical_records = []
        
        for idx, row in df_input.iterrows():
            medicine_name = row['MedicineName']
            category = row['Category']
            avg_sales = float(row['AvgMonthlySales'])
            
            # Generate medicine ID (MED + zero-padded index)
            medicine_id = f"MED{str(idx + 1).zfill(3)}"
            
            # Generate 12 months of data
            monthly_sales = generate_monthly_sales(avg_sales, category, num_months=12)
            
            for month, quantity in enumerate(monthly_sales, start=1):
                historical_records.append({
                    'medicineId': medicine_id,
                    'medicineName': medicine_name,
                    'month': month,
                    'quantity': quantity,
                    'category': category
                })
        
        # Create DataFrame and save
        df_output = pd.DataFrame(historical_records)
        df_output.to_csv(OUTPUT_FILE, index=False)
        
        print(f"\n[SUCCESS] Conversion completed!")
        print(f"   Input: {len(df_input)} medicines")
        print(f"   Output: {len(df_output)} records (12 months per medicine)")
        print(f"   Saved to: {OUTPUT_FILE}")
        
        # Show sample
        print("\n[SAMPLE] First 6 records:")
        print(df_output.head(6).to_string(index=False))
        
        # Show statistics
        print("\n[STATS] Monthly quantity statistics:")
        print(f"   Min: {df_output['quantity'].min()}")
        print(f"   Max: {df_output['quantity'].max()}")
        print(f"   Average: {df_output['quantity'].mean():.1f}")
        
        print("\n[STATS] Category distribution:")
        category_counts = df_output.groupby('category')['medicineId'].nunique()
        for cat, count in category_counts.items():
            print(f"   {cat}: {count} medicines")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    random.seed(42)  # For reproducible results
    success = convert_inventory_to_training_data()
    
    if success:
        print("\n" + "=" * 60)
        print("Data conversion successful!")
        print("You can now use the multi-agent prediction system.")
        print("=" * 60)
    else:
        raise SystemExit(1)
