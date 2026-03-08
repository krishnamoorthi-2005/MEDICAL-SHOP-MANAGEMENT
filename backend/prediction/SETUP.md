# Python Setup for AI Prediction System

## Quick Fix for Training Errors

If you're getting an error like "Dataset uploaded but training failed", follow these steps:

### Step 1: Check Python Installation

Open a terminal/command prompt and run:

```bash
python --version
```

If you see an error, you need to install Python first.

**For Windows:**
1. Download Python from https://www.python.org/downloads/
2. During installation, **check "Add Python to PATH"**
3. Restart your terminal after installation

**For macOS/Linux:**
```bash
# macOS
brew install python

# Ubuntu/Debian
sudo apt install python3 python3-pip
```

### Step 2: Install Required Dependencies

Navigate to the backend/prediction folder and run:

```bash
cd backend/prediction
pip install -r requirements.txt
```

Or install just the essential package:

```bash
pip install pandas
```

### Step 3: Verify Installation

Test that everything is working:

```bash
python train_multiagent.py
```

If you see `[ERROR] Training data not found`, that's normal - it means Python and pandas are working correctly!

---

## Common Issues

### "python: command not found"

**Solution:** Try these alternatives:
```bash
python3 --version
py --version
```

Use whichever command works for you (python, python3, or py).

### "No module named 'pandas'"

**Solution:** Install pandas:
```bash
pip install pandas

# Or if pip doesn't work:
python -m pip install pandas
python3 -m pip install pandas
py -m pip install pandas
```

### "pip: command not found"

**Solution:** Install pip first:
```bash
# Windows
python -m ensurepip --upgrade

# macOS/Linux
sudo apt install python3-pip  # Ubuntu/Debian
brew install python           # macOS
```

### Windows Encoding Errors

If you see Unicode/charmap errors, the latest version of the scripts should fix this automatically. Make sure you're using the updated train_multiagent.py and predict_multiagent.py files.

---

## Testing the Multi-Agent System

After installation, test with demo data:

```bash
cd backend/prediction

# Create demo dataset
python create_demo_data.py

# Prepare data
python train_multiagent.py

# Generate predictions for July (Monsoon season)
python predict_multiagent.py 7
```

You should see predictions with High priority for Fever, Antibiotics, and Cold/Cough medicines!

---

## Using from the UI

Once Python and pandas are installed:

1. Go to **Settings** page in the pharmacy app
2. Click **"Upload Training Dataset"**
3. Upload your CSV file with sales data
4. The system will automatically:
   - Detect Python command (python/python3/py)
   - Run training script
   - Prepare data with auto-categorization
5. Go to **AI Audit Assistant** to see predictions

---

## Minimum Requirements

- **Python:** 3.7 or higher
- **pandas:** 1.3.0 or higher (required)
- **scikit-learn:** 0.24.0 or higher (optional, for ML models)
- **pymongo:** 3.12.0 or higher (optional, for MongoDB extraction)

---

## Getting Help

If you're still having issues:

1. Check that Python is in your PATH
2. Try running commands with `python`, `python3`, or `py`
3. Make sure you're in the correct directory (backend/prediction)
4. Check the error message in the UI for specific details
5. Look at the backend console logs for full error traces

For more details, see README_MULTIAGENT.md
