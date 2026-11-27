# SludgeTrace Backend API

FastAPI microservice providing machine learning predictions and database access for the SludgeTrace wastewater treatment plant operations.

## Project Structure

```
backend/
  ├── .env                   # Environment variables (SUPABASE_URL, etc.)
  ├── .gitignore             # Git ignore patterns
  ├── main.py                # FastAPI app, lifespan handler, and API routes
  ├── ml_service.py          # ML model loader, input validation, and inference
  ├── requirements.txt       # Pinned dependencies
  ├── test_db.py             # Database connectivity test script
  └── models/                # Trained ML artifacts (DO NOT modify or delete)
      ├── features.json
      ├── model_regression.joblib
      └── model_anomaly.joblib
```

---

## Setup & Run Guide (Windows PowerShell)

### 1. Open PowerShell and navigate to the backend folder
```powershell
cd c:\Users\huzef\OneDrive\Desktop\sewagetrace\backend
```

### 2. Create and activate a Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
> *Note:* If PowerShell blocks script execution, run:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
> .\venv\Scripts\Activate.ps1
> ```

### 3. Install dependencies
```powershell
pip install -r requirements.txt
```

### 4. Verify Supabase Database Connection
```powershell
python test_db.py
```

### 5. Run the FastAPI Development Server
On Windows PowerShell, run the module directly via Python:
```powershell
python -m uvicorn main:app --reload
```

The API will be available at:
- **Base Route:** `http://localhost:8000/`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`
- **ML Info:** `http://localhost:8000/ml/info`
- **ML Predict:** `POST http://localhost:8000/ml/predict`

---

## API Endpoints

### `GET /`
Returns service metadata and navigation links:
```json
{
  "service": "SludgeTrace API",
  "docs": "/docs",
  "health": "/health"
}
```

### `GET /health`
Returns system and model health status:
```json
{
  "status": "ok",
  "ml_loaded": true,
  "ml_error": null,
  "supabase_configured": true
}
```

### `GET /ml/info`
Returns model training metadata, features, metrics, and versions.

### `POST /ml/predict`
Predicts sludge generation factor (`sludge_kg_per_m3_estimate`) and detects unusual process parameter inputs:

#### Request Body
```json
{
  "Influent_BOD_mgL": 350.0,
  "Influent_COD_mgL": 800.0,
  "Influent_TSS_mgL": 250.0,
  "Influent_NH4_mgL": 30.0,
  "Aeration_Tank_DO_mgL": 2.2,
  "Aeration_Tank_Temp_C": 26.5,
  "Air_Flow_km3h": 12.0,
  "pH": 7.4,
  "ORP_mV": 120.0
}
```

#### Response (200 OK)
```json
{
  "sludge_kg_per_m3_estimate": 0.05628,
  "unusual_inputs": false,
  "model": "rf",
  "note": "Derived label, municipal data, advisory only, not validated for industrial sludge."
}
```
If models cannot be loaded, returns `503 Service Unavailable`.
If input is invalid, missing fields, or contains unrecognized extra fields, returns `422 Unprocessable Entity`.
