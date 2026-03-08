# 🤖 Multi-Agent Prediction System

## Overview

This pharmacy management system now includes an **intelligent multi-agent prediction system** that uses seasonal disease patterns, inventory trends, and smart buffering strategies to recommend optimal medicine purchase quantities.

Unlike traditional machine learning models that require extensive training data, this multi-agent system uses domain knowledge about seasonal diseases and intelligent rule-based agents to generate accurate predictions.

---

## 🔧 System Architecture

The prediction system consists of **4 specialized AI agents** working together:

### 1. **Inventory Agent** 📊
- Fetches historical sales data from the database
- Calculates average monthly sales for each medicine
- Estimates current stock levels
- Provides baseline demand metrics

### 2. **Disease Mapper Agent** 🏥
- Maps months to common seasonal diseases
- Identifies high-risk disease categories for each season
- Assigns priority weights based on disease-season alignment
- Examples:
  - **Monsoon (Jun-Sep)**: Fever, Cold/Cough, Antibiotics → 80% boost
  - **Winter (Nov-Feb)**: Cold/Cough, Painkillers, Vitamins → 80% boost
  - **Spring (Mar-May)**: Allergies, Gastric medicines → 80% boost

### 3. **Seasonal Buffer Agent** 🌦️
- Applies seasonal multipliers for safety stock
- Accounts for increased demand volatility
- Buffer levels:
  - **Monsoon**: 30% additional buffer
  - **Winter**: 20% additional buffer
  - **Spring**: 15% additional buffer
  - **Standard**: 10% safety buffer

### 4. **Master Decision Agent** 🎯
- Orchestrates all agents
- Calculates final predicted demand: `Base Demand × Disease Weight × Seasonal Weight`
- Generates confidence scores based on seasonal alignment
- Outputs purchase recommendations

---

## 📁 File Structure

```
backend/prediction/
├── predict_multiagent.py      # Main prediction engine (NEW)
├── train_multiagent.py        # Data preparation & validation (NEW)
├── extract_from_mongo.py      # Extract sales data from MongoDB (UPDATED)
├── predict.py                 # Original ML-based prediction (legacy)
├── train.py                   # Original ML training (legacy)
├── training_data.csv          # Historical sales data with categories
└── pharmacy_models.pkl        # Legacy ML models (optional)
```

---

## 🚀 Quick Start

### Step 1: Extract Data from MongoDB

```bash
cd backend/prediction
python extract_from_mongo.py
```

This creates `training_data.csv` with columns:
- `medicineId`: Unique medicine identifier
- `medicineName`: Medicine name
- `category`: Medicine category (Fever, Antibiotic, etc.)
- `date`: Sale date
- `quantity`: Quantity sold
- `month`: Month number (1-12)

### Step 2: Prepare Data (Auto-categorization)

```bash
python train_multiagent.py
```

This script:
- Validates the training data
- Auto-adds categories if missing
- Shows dataset statistics
- Prepares data for the multi-agent system

### Step 3: Generate Predictions

```bash
# Predict for current month
python predict_multiagent.py

# Predict for specific month (e.g., July = 7)
python predict_multiagent.py 7
```

Output (JSON format):
```json
[
  {
    "medicineId": "60a1b2c3d4e5f6g7h8i9j0k1",
    "medicineName": "Paracetamol 500mg",
    "predictedDemand": 850,
    "confidence": 0.90,
    "category": "Fever",
    "seasonalAlignment": "High"
  }
]
```

---

## 🌐 API Integration

### Endpoint: Get Monthly Predictions

```http
GET /api/predictions?month=7&multiAgent=true
```

**Parameters:**
- `month` (optional): Month number 1-12 (default: current month)
- `multiAgent` (optional): Use multi-agent system (default: `true`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "medicineId": "...",
      "medicineName": "Paracetamol 500mg",
      "month": 7,
      "predictedDemand": 850,
      "currentStock": 500,
      "previousSales": 620,
      "recommendedPurchase": 371,
      "confidence": 0.90,
      "category": "Fever",
      "seasonalAlignment": "High"
    }
  ]
}
```

### Upload Training Dataset

You can upload a custom sales dataset via the Settings page in the UI, or use the API:

```http
POST /api/predictions/upload
Content-Type: multipart/form-data

{
  "file": <training_data.csv>
}
```

The system will automatically:
1. Validate the CSV format
2. Add categories if missing
3. Prepare the data for predictions
4. Return success confirmation

---

## 📊 Medicine Categories

The system recognizes these categories for seasonal alignment:

| Category | Common Medicines | Seasonal Priority |
|----------|------------------|-------------------|
| **Fever** | Paracetamol, Ibuprofen | Monsoon, Winter |
| **Antibiotic** | Amoxicillin, Azithromycin | Monsoon |
| **Cold/Cough** | Cetirizine, Cough Syrups | Monsoon, Winter |
| **Painkiller** | Diclofenac, Aspirin | Winter |
| **Allergy** | Antihistamines, Allegra | Spring |
| **Gastric** | Omeprazole, Antacids | Spring |
| **Vitamin** | Multivitamins, Supplements | Winter |
| **Antifungal** | Fluconazole, Clotrimazole | Monsoon |
| **General** | Other medicines | All seasons |

---

## 🧪 Testing the System

### Test 1: Monsoon Season (July - Month 7)

```bash
python predict_multiagent.py 7
```

Expected behavior:
- **High priority**: Fever, Cold/Cough, Antibiotics (1.8× weight)
- **Seasonal buffer**: 30% additional stock
- **Confidence**: 90-95% for aligned medicines

### Test 2: Winter Season (December - Month 12)

```bash
python predict_multiagent.py 12
```

Expected behavior:
- **High priority**: Cold/Cough, Painkillers, Vitamins (1.8× weight)
- **Seasonal buffer**: 20% additional stock

### Test 3: Spring Season (April - Month 4)

```bash
python predict_multiagent.py 4
```

Expected behavior:
- **High priority**: Allergy, Gastric medicines (1.8× weight)
- **Seasonal buffer**: 15% additional stock

---

## 🔄 Switching Between Systems

The application supports both prediction systems:

### Use Multi-Agent System (Recommended)
```http
GET /api/predictions?multiAgent=true
```

### Use Original ML System
```http
GET /api/predictions?multiAgent=false
```

The multi-agent system is now the **default** because it:
- ✅ Requires less training data
- ✅ Works better with seasonal patterns
- ✅ Provides explainable predictions
- ✅ Adapts quickly to changing trends
- ✅ Includes domain expertise

---

## 🛠️ Customization

### Adjust Seasonal Weights

Edit `predict_multiagent.py` → `DiseaseAgent` class:

```python
def get_priority_weight(self, month, category):
    target_diseases, _ = self.get_seasonal_diseases(month)
    if category in target_diseases:
        return 1.8  # Change this value (1.0 = no boost, 2.0 = 100% boost)
    return 1.0
```

### Adjust Buffer Levels

Edit `predict_multiagent.py` → `SeasonalAgent` class:

```python
def get_season_multiplier(self, month):
    if month in [6, 7, 8, 9]: return 1.3  # Adjust monsoon buffer
    if month in [11, 12, 1]: return 1.2   # Adjust winter buffer
    return 1.1  # Adjust standard buffer
```

### Add New Disease Categories

Edit `predict_multiagent.py` → `DiseaseAgent`:

```python
def get_seasonal_diseases(self, month):
    if month in [6, 7, 8, 9]:
        return ['Fever', 'Cold/Cough', 'Antibiotic', 'YourNewCategory'], "Description"
```

---

## 📈 Performance Insights

### Advantages of Multi-Agent System

1. **Domain Knowledge Integration**: Uses medical expertise about seasonal diseases
2. **Explainable AI**: Clear reasoning for each prediction
3. **Quick Deployment**: No extensive training required
4. **Adaptive**: Easy to update rules as patterns change
5. **Confidence Scoring**: Based on seasonal alignment, not just historical fit

### When to Use Original ML System

- Large datasets (>2 years of daily sales data)
- Stable, non-seasonal products
- Need pure data-driven predictions
- Have significant computational resources for training

---

## 🐛 Troubleshooting

### Error: "MODEL_NOT_FOUND"
**Solution**: Run `python extract_from_mongo.py` to create training_data.csv

### Empty Predictions
**Solution**: 
1. Check if `training_data.csv` has data
2. Run `python train_multiagent.py` to validate
3. Ensure medicines have valid categories

### Low Confidence Scores
**Solution**: This means medicines don't align with seasonal diseases. You can:
1. Check category assignments
2. Verify seasonal disease mappings
3. Adjust confidence calculation in MasterAgent

### Categories Missing
**Solution**: Run `python train_multiagent.py` - it will auto-categorize based on medicine names

---

## 📞 Support

For questions or issues:
1. Check the console output for detailed error messages
2. Review `training_data.csv` format
3. Ensure Python dependencies are installed: `pandas`
4. Verify MongoDB connection in `extract_from_mongo.py`

---

## 🎯 Future Enhancements

Potential improvements:
- [ ] Machine learning hybrid (combine ML predictions with agent rules)
- [ ] Regional disease pattern customization
- [ ] Epidemic/pandemic early warning signals
- [ ] Supplier lead time integration
- [ ] Price optimization recommendations
- [ ] Expiry date consideration
- [ ] Historical accuracy tracking

---

## 📝 Version History

**v2.0** - Multi-Agent System
- ✨ Intelligent seasonal disease mapping
- ✨ 4-agent architecture
- ✨ Auto-categorization
- ✨ Confidence scoring
- ✨ Enhanced data extraction with categories

**v1.0** - Original ML System
- Random Forest models
- Basic sales prediction
- Manual training required

---

**Made with ❤️ for smarter pharmacy inventory management**
