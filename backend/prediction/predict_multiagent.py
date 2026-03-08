import json
import pathlib
import sys
from datetime import datetime

# Check for required dependencies
try:
    import pandas as pd
except ImportError:
    print("[ERROR] pandas library is not installed")
    print("Please install it using: pip install pandas")
    sys.exit(1)

BASE_DIR = pathlib.Path(__file__).resolve().parent
TRAINING_DATA_PATH = BASE_DIR / "training_data.csv"


# --- AGENT 1: Inventory Fetcher ---
class InventoryAgent:
    """Fetches and manages inventory data from the training dataset"""
    
    def __init__(self, file_path):
        self.file_path = file_path

    def get_records(self, product_name="All"):
        """Load inventory records, optionally filtered by product name"""
        try:
            df = pd.read_csv(self.file_path)
            
            # Ensure required columns exist
            required_cols = {'medicineId', 'medicineName', 'month', 'quantity'}
            if not required_cols.issubset(df.columns):
                return pd.DataFrame()
            
            if product_name.lower() == "all":
                return df
            return df[df['medicineName'].str.contains(product_name, case=False, na=False)]
        except (FileNotFoundError, pd.errors.EmptyDataError):
            return pd.DataFrame()
    
    def calculate_monthly_stats(self, df):
        """Calculate average monthly sales and current stock estimation"""
        stats = []
        
        for medicine_id in df['medicineId'].dropna().unique():
            med_data = df[df['medicineId'] == medicine_id]
            
            # Calculate average monthly sales from historical data
            avg_monthly_sales = med_data['quantity'].mean()
            
            # Get medicine details
            medicine_name = med_data['medicineName'].iloc[0] if not med_data.empty else str(medicine_id)
            
            # Get category (default to 'General' if not available)
            category = med_data['category'].iloc[0] if 'category' in med_data.columns else 'General'
            
            # Estimate current stock (use most recent month's data or calculate from trend)
            # In production, this would come from real-time stock data
            recent_quantity = med_data.nlargest(3, 'month')['quantity'].mean()
            estimated_stock = max(0, int(recent_quantity * 1.2))  # Buffer estimation
            
            stats.append({
                'medicineId': str(medicine_id),
                'medicineName': medicine_name,
                'category': category,
                'avgMonthlySales': float(avg_monthly_sales),
                'currentStock': estimated_stock
            })
        
        return pd.DataFrame(stats)


# --- AGENT 2: Disease Mapper Agent ---
class DiseaseAgent:
    """Maps months to seasonal diseases and assigns priority weights"""
    
    def get_seasonal_diseases(self, month):
        """Returns priority diseases for the given month and season description"""
        if month in [6, 7, 8, 9]:
            return ['Fever', 'Cold/Cough', 'Antibiotic', 'Antifungal'], "Monsoon-related infections"
        elif month in [11, 12, 1, 2]:
            return ['Cold/Cough', 'Fever', 'Painkiller', 'Vitamin'], "Winter flu and immunity"
        elif month in [3, 4, 5]:
            return ['Allergy', 'Gastric', 'Antihistamine'], "Spring allergies and heat-related issues"
        else:
            return ['General', 'Vitamin'], "General health maintenance"

    def get_priority_weight(self, month, category):
        """Calculate priority multiplier based on seasonal disease alignment"""
        target_diseases, _ = self.get_seasonal_diseases(month)
        
        # Normalize category for matching
        category_normalized = str(category).strip().title()
        
        # High priority for seasonal diseases
        for disease in target_diseases:
            if disease.lower() in category_normalized.lower():
                return 1.8  # 80% increase for high-risk categories
        
        # Medium priority for related categories
        if month in [6, 7, 8, 9] and any(x in category_normalized.lower() for x in ['pain', 'anti']):
            return 1.4
        elif month in [11, 12, 1, 2] and any(x in category_normalized.lower() for x in ['vitamin', 'supplement']):
            return 1.4
        
        return 1.0  # Standard priority


# --- AGENT 3: Seasonal Buffer Agent ---
class SeasonalAgent:
    """Applies seasonal multipliers for inventory buffering"""
    
    def get_season_multiplier(self, month):
        """Return seasonal buffer multiplier based on month"""
        if month in [6, 7, 8, 9]:
            return 1.3  # High Monsoon Buffer (30% extra)
        if month in [11, 12, 1]:
            return 1.2  # Winter Buffer (20% extra)
        if month in [3, 4, 5]:
            return 1.15  # Spring Buffer (15% extra)
        return 1.1  # Standard Safety Buffer (10% extra)
    
    def get_season_name(self, month):
        """Get human-readable season name"""
        if month in [6, 7, 8, 9]:
            return "Monsoon"
        elif month in [11, 12, 1]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        return "Standard"


# --- AGENT 4: Master Decision Agent ---
class MasterAgent:
    """Orchestrates all agents to generate intelligent predictions"""
    
    def __init__(self, csv_file):
        self.inventory_ag = InventoryAgent(csv_file)
        self.disease_ag = DiseaseAgent()
        self.seasonal_ag = SeasonalAgent()

    def run_prediction(self, target_month):
        """Generate predictions for the specified month"""
        
        # 1. Fetch all historical data
        raw_data = self.inventory_ag.get_records("All")
        if raw_data.empty:
            return []

        # 2. Calculate monthly statistics per medicine
        inventory_stats = self.inventory_ag.calculate_monthly_stats(raw_data)
        if inventory_stats.empty:
            return []

        # 3. Identify current seasonal risks
        _, risk_desc = self.disease_ag.get_seasonal_diseases(target_month)
        season_name = self.seasonal_ag.get_season_name(target_month)
        
        # 4. Generate predictions for each medicine
        results = []
        for _, row in inventory_stats.iterrows():
            # Get disease priority weight
            disease_weight = self.disease_ag.get_priority_weight(target_month, row['category'])
            
            # Get seasonal multiplier
            seasonal_weight = self.seasonal_ag.get_season_multiplier(target_month)
            
            # Calculate predicted demand using multi-agent weights
            base_demand = row['avgMonthlySales']
            predicted_demand = base_demand * disease_weight * seasonal_weight
            
            # Calculate confidence score based on:
            # 1. How well the category aligns with seasonal diseases (disease_weight > 1.0 = higher confidence)
            # 2. Data quality (more historical data = higher confidence)
            base_confidence = 0.75  # Base confidence for multi-agent system
            
            # Boost confidence for seasonally aligned medicines
            if disease_weight > 1.5:
                confidence = min(0.95, base_confidence + 0.15)
            elif disease_weight > 1.0:
                confidence = min(0.90, base_confidence + 0.10)
            else:
                confidence = base_confidence
            
            results.append({
                "medicineId": row['medicineId'],
                "medicineName": row['medicineName'],
                "predictedDemand": int(round(predicted_demand)),
                "confidence": round(confidence, 2),
                "category": row['category'],
                "seasonalAlignment": "High" if disease_weight > 1.5 else "Medium" if disease_weight > 1.0 else "Normal"
            })

        return results


def main() -> None:
    """Main entry point for the prediction script"""
    
    # Parse month from command line or use current month
    if len(sys.argv) > 1:
        try:
            month = int(sys.argv[1])
            if month < 1 or month > 12:
                month = datetime.now().month
        except ValueError:
            month = datetime.now().month
    else:
        month = datetime.now().month

    # Check if training data exists
    if not TRAINING_DATA_PATH.exists():
        raise SystemExit("MODEL_NOT_FOUND")

    # Initialize master agent
    master = MasterAgent(TRAINING_DATA_PATH)
    
    # Run prediction
    predictions = master.run_prediction(month)
    
    # Filter out zero/negative predictions
    predictions = [p for p in predictions if p['predictedDemand'] > 0]
    
    # Output as JSON (compatible with existing controller)
    print(json.dumps(predictions))


if __name__ == "__main__":
    main()
