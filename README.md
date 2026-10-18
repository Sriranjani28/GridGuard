# ⚡ GridGuard – Intelligent Electricity Demand Forecasting & Overload Risk Analysis

**GridGuard** is an AI-powered electricity monitoring and forecasting platform designed to predict future electricity demand, identify unusual consumption patterns, and assess potential grid overload risks.

Built using Machine Learning and a modern web dashboard, GridGuard helps users understand electricity consumption patterns and make informed decisions through data-driven insights.

## 🚀 Project Overview

Electricity demand changes continuously based on usage patterns, time, and other factors. Unexpected increases in demand can put additional pressure on electrical grids.

GridGuard addresses this challenge by combining historical electricity consumption data with Machine Learning to:

- Forecast future electricity demand.
- Monitor electricity consumption patterns.
- Identify unusual demand variations and anomalies.
- Assess potential overload risks using explainable demand indicators.
- Display important metrics through an interactive dashboard.

## ✨ Key Features

### 1. Electricity Demand Forecasting
- Uses a trained Gradient Boosting Regressor model.
- Predicts electricity demand using historical consumption patterns.
- Considers hourly, daily, weekly, and monthly trends.

### 2. Overload Risk Analysis
- Analyses demand levels and unusual consumption patterns.
- Provides interpretable indicators of potential overload conditions.
- Helps identify periods of unusually high electricity demand.

*Note: The risk score is an explainable demand/overload proxy, not a prediction of actual power outages.*

### 3. Anomaly Detection
- Identifies unusual variations in electricity consumption.
- Helps highlight unexpected demand patterns.

### 4. Interactive Dashboard
- React-based user interface.
- Visualizes demand forecasts and electricity metrics.
- Uses Recharts for graphical representations.
- Provides an accessible view of electricity consumption insights.

### 5. REST API Integration
The FastAPI backend provides endpoints for accessing forecasting results, risk analysis, anomalies, and system metrics.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn, Gradient Boosting Regressor |
| Data Processing | Pandas, NumPy |
| Data Visualization | Recharts |
| Model Storage | Joblib / Pickle |
| Platform | IBM LinuxONE / IBM z16 |

## 🤖 Machine Learning Model

GridGuard uses a **Gradient Boosting Regressor** trained on historical household electricity consumption data.

### Dataset Information

- Dataset: Individual Household Electric Power Consumption
- Total Records: 34,168
- Data Period: December 16, 2006 – November 26, 2010

### Features Used

The model uses eight input features:

1. Hour
2. Day of Week
3. Month
4. Weekend Indicator
5. Previous Hour Demand (lag_1)
6. Previous 24-Hour Demand (lag_24)
7. Previous 168-Hour Demand (lag_168)
8. 24-Hour Rolling Mean

### Model Performance

| Metric | GridGuard Model |
|---|---:|
| MAE | 0.3436 |
| RMSE | 0.4964 |
| MAPE | 42.96% |

The model was also compared against a baseline forecasting approach.

## 🔌 API Endpoints

The FastAPI backend provides the following endpoints:

| Endpoint | Description |
|---|---|
| `/health` | Checks backend health |
| `/api/summary` | Provides electricity summary |
| `/api/forecast` | Generates demand forecasts |
| `/api/risk` | Provides overload risk analysis |
| `/api/anomalies` | Identifies unusual demand patterns |
| `/api/metrics` | Returns model and system metrics |

## 📂 Project Structure

```text
GridGuard/
│
├── backend/
│   ├── data_provider.py
│   ├── ml_provider.py
│   ├── ml_assets/
│   │   ├── gridguard_model.pkl
│   │   └── hourly_demand.csv
│   └── ...
│
├── frontend/
│   └── ...
│
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.10+
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Sriranjani28/GridGuard.git
cd GridGuard
```

### 2. Set Up the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Start the FastAPI server using the project's configured application module:

```bash
uvicorn main:app --reload
```

*If your FastAPI entry-point filename differs, replace `main:app` with the correct module and application name.*

### 3. Set Up the Frontend

Open another terminal:

```bash
cd GridGuard/frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🌐 Platform

GridGuard is developed for deployment and execution on **IBM LinuxONE / IBM z16**, exploring the use of AI and machine learning for intelligent electricity demand analysis.

## 🔮 Future Enhancements

- Integration with real-time smart meter data.
- Improved forecasting accuracy using advanced ML models.
- Enhanced anomaly detection mechanisms.
- More detailed grid monitoring and analytics.
- Scalable deployment for multiple electricity distribution environments.

## 👩‍💻 Contributors

Developed as a collaborative project for a datathon.

## 📜 License

This project is developed for educational and demonstration purposes.

---

**GridGuard – Making Electricity Demand Smarter, Safer, and More Predictable.** ⚡
