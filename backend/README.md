# GridGuard Backend Service

FastAPI forecasting and demand-overload risk analysis service for the IBM Z Datathon.

> **CRITICAL DEMO DATA NOTICE**  
> All endpoints currently return deterministic synthetic demo data for testing and UI evaluation.  
> The **Demand Risk Score** is a synthetic proxy overload index (0–100) calculated from forecast pressure, anomaly flags, and weather stress.  
> **No actual outage data exists. Never treat or describe this metric as an outage prediction or outage probability.**

---

## 1. Prerequisites & Virtual Environment

The service runs under Python 3.12+ with pure-Python dependencies (FastAPI, Uvicorn, Pydantic) to ensure seamless portability to IBM LinuxONE (`s390x`) architectures.

All commands below are PowerShell-compatible and use the project's existing virtual environment at `.\.venv\bin\python.exe`.

### Install Dependencies
From the repository root:
```powershell
.\.venv\bin\python.exe -m pip install -r backend\requirements.txt
```

---

## 2. Running the Server

Run Uvicorn on port 8000 from the `backend\` directory:
```powershell
# From the repository root:
.\.venv\bin\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Once started:
* **Interactive API Documentation (Swagger / OpenAPI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. API Endpoints & Example Calls

| Endpoint | Method | Query Param | Description |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | — | Liveness check and active data source name |
| `/api/summary` | `GET` | `date=YYYY-MM-DD` | Top-level operational KPIs (peak kW, risk score, high-risk hours) |
| `/api/forecast` | `GET` | `date=YYYY-MM-DD` | 24-hour observed vs predicted demand curve (kW) and $q95$ threshold |
| `/api/risk` | `GET` | `date=YYYY-MM-DD` | 24-hour hourly risk scores (0–100), risk bands, and top explanatory drivers |
| `/api/anomalies`| `GET` | `date=YYYY-MM-DD` | Flagged telemetry outliers (residual $\|z\| > 3.0$ or voltage dips) |
| `/api/metrics` | `GET` | — | Model evaluation benchmarks comparing baseline vs ML ensemble |

### Example PowerShell Calls

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:8000/health"

# Get 24-hour forecast for October 17, 2026
Invoke-RestMethod -Uri "http://localhost:8000/api/forecast?date=2026-10-17"

# Get risk evaluation
Invoke-RestMethod -Uri "http://localhost:8000/api/risk?date=2026-10-17"

# Get detected anomalies
Invoke-RestMethod -Uri "http://localhost:8000/api/anomalies?date=2026-10-17"

# Get summary KPIs
Invoke-RestMethod -Uri "http://localhost:8000/api/summary?date=2026-10-17"

# Test input validation (returns HTTP 422 for malformed date)
try {
    Invoke-RestMethod -Uri "http://localhost:8000/api/forecast?date=invalid-date"
} catch {
    $_.Exception.Response.StatusCode
}
```

---

## 4. Connecting the Frontend to the Backend

By default, the React frontend in `/frontend` operates in offline mock mode (`VITE_USE_DEMO_DATA=true`).

To connect the frontend to this live FastAPI backend:

1. Create or edit `frontend\.env` (or `frontend\.env.local`):
   ```ini
   VITE_USE_DEMO_DATA=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. Restart or reload the frontend dev server at `http://localhost:5173`.
3. The persistent `DEMO DATA` banner will disappear, the top connection status indicator will turn green (`LIVE`), and telemetry will be fetched directly from `http://localhost:8000`.

---

## 5. Model Integration Seam (Teammate CSV Adapter)

Backend data retrieval is isolated behind `BaseDataProvider` in [`data_provider.py`](data_provider.py).

When your ML teammate generates the production `forecast_risk.csv` on the IBM LinuxONE host, a `CsvDataProvider` can be plugged in without modifying any FastAPI route handlers:

### Expected CSV Column Mapping
* `timestamp` (index) $\rightarrow$ `timestamp` (ISO `YYYY-MM-DDTHH:00:00`)
* `kw` $\rightarrow$ `actual_kw` (float, null for future hours)
* `pred` $\rightarrow$ `predicted_kw` (float)
* `q95` $\rightarrow$ `threshold_q95` (float)
* `risk` $\rightarrow$ `risk_score` (int, 0–100)
* `band` $\rightarrow$ `band` (`"Low"` / `"Medium"` / `"High"`)
* `z` $\rightarrow$ `z_score` (float)
* `anom` $\rightarrow$ `anomaly_flag` (boolean)
* `volt_dip` $\rightarrow$ `voltage_dip` (boolean)
* `wx` $\rightarrow$ `weather_stress` (`"Moderate"` / `"Elevated"`)
* `pressure` $\rightarrow$ `pressure` (int, 0–100)

Select the active provider by setting the environment variable:
```powershell
$env:DATA_SOURCE = "demo" # or "csv" once implemented
```
Startup validation ensures that unsupported data sources fail fast with a clear error message.
