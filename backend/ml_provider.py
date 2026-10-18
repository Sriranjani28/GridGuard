import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


class MLProvider:
    def __init__(self):
        base = os.path.dirname(__file__)
        assets = os.path.join(base, "ml_assets")

        model_data = joblib.load(
            os.path.join(assets, "gridguard_model.pkl")
        )
        self.model = model_data["model"]
        self.features = model_data["features"]

        self.data = pd.read_csv(
            os.path.join(assets, "hourly_demand.csv"),
            parse_dates=["Timestamp"]
        )
        self.data = self.data.set_index("Timestamp").sort_index()
        self.data = self.data[~self.data.index.duplicated(keep="first")]

        self.data["demand_kw"] = pd.to_numeric(
            self.data["demand_kw"], errors="coerce"
        )
        self.data = self.data.dropna(subset=["demand_kw"])

        self.mae = 0.3436
        self.rmse = 0.4964
        self.mape = 42.96
        self.baseline_mae = 0.5999
        self.baseline_rmse = 0.8600
        self.baseline_mape = 77.76

        self.overall_q95 = float(
            self.data["demand_kw"].quantile(0.95)
        )
        self.thresholds = self.data.groupby(
            [self.data.index.dayofweek, self.data.index.hour]
        )["demand_kw"].quantile(0.95)

        self.start_date = self.data.index.min().date()
        self.end_date = self.data.index.max().date()

    def _predict_hour(self, timestamp, history):
        past = history.loc[:timestamp - timedelta(hours=1)]

        if len(past) < 168:
            raise ValueError("Not enough historical data for prediction")

        values = {
            "hour": timestamp.hour,
            "day_of_week": timestamp.weekday(),
            "month": timestamp.month,
            "is_weekend": int(timestamp.weekday() >= 5),
            "lag_1": past.iloc[-1],
            "lag_24": past.iloc[-24],
            "lag_168": past.iloc[-168],
            "rolling_mean_24": past.iloc[-24:].mean()
        }

        row = pd.DataFrame([values])[self.features]
        return float(self.model.predict(row)[0])

    def get_daily_data(self, date_str):
        selected = datetime.strptime(date_str, "%Y-%m-%d").date()

        if selected < self.start_date or selected > self.end_date:
            raise ValueError("Date is outside the available dataset")

        history = self.data["demand_kw"].copy()
        results = []

        for hour in range(24):
            timestamp = datetime.combine(
                selected, datetime.min.time()
            ) + timedelta(hours=hour)

            predicted = self._predict_hour(timestamp, history)

            actual = (
                float(history.loc[timestamp])
                if timestamp in history.index else None
            )

            if actual is None:
                history.loc[timestamp] = predicted

            threshold = float(
                self.thresholds.get(
                    (timestamp.weekday(), timestamp.hour),
                    self.overall_q95
                )
            )

            results.append({
                "timestamp": timestamp.isoformat(),
                "hour": f"{hour:02d}",
                "display_time": timestamp.strftime("%H:00"),
                "actual_kw": actual,
                "predicted_kw": predicted,
                "threshold_q95": threshold
            })

        return results

    def get_forecast(self, date_str):
        return self.get_daily_data(date_str)

    def get_risk(self, date_str):
        daily = self.get_daily_data(date_str)
        results = []

        for item in daily:
            predicted = item["predicted_kw"]
            threshold = max(item["threshold_q95"], 0.01)

            pressure = min(100.0, predicted / threshold * 100)
            band = (
                "High" if pressure > 70
                else "Medium" if pressure >= 40
                else "Low"
            )

            actual = item["actual_kw"]
            z_score = (
                (actual - predicted) / self.rmse
                if actual is not None else 0.0
            )
            anomaly = actual is not None and abs(z_score) >= 3

            results.append({
                **item,
                "risk_score": int(round(pressure)),
                "band": band,
                "top_driver": "Predicted demand",
                "pressure": int(round(pressure)),
                "anomaly_flag": anomaly,
                "voltage_dip": False,
                "weather_stress": "Unknown",
                "z_score": round(z_score, 2)
            })

        return results

    def get_anomalies(self, date_str):
        return [
            {
                "timestamp": item["timestamp"],
                "display_time": item["display_time"],
                "actual_kw": item["actual_kw"],
                "expected_kw": item["predicted_kw"],
                "z_score": item["z_score"],
                "reason": "Unusual demand deviation",
                "severity": (
                    "High" if abs(item["z_score"]) >= 4 else "Medium"
                ),
                "description": "Observed demand differs significantly from model prediction."
            }
            for item in self.get_risk(date_str)
            if item["anomaly_flag"]
        ]

    def get_metrics(self):
        return {
            "baseline_mae": self.baseline_mae,
            "baseline_rmse": self.baseline_rmse,
            "baseline_mape": self.baseline_mape,
            "model_mae": self.mae,
            "model_rmse": self.rmse,
            "model_mape": self.mape
        }
    def get_summary(self, date_str):
        forecast = self.get_forecast(date_str)
        risks = self.get_risk(date_str)
        anomalies = self.get_anomalies(date_str)

        peak = max(forecast, key=lambda x: x["predicted_kw"])
        peak_risk = max(risks, key=lambda x: x["risk_score"])

        observed = [x for x in forecast if x["actual_kw"] is not None]
        latest = observed[-1] if observed else None

        return {
            "current_kw": latest["actual_kw"] if latest else 0.0,
            "current_hour": latest["display_time"] if latest else None,
            "predicted_peak_kw": peak["predicted_kw"],
            "peak_hour": peak["display_time"],
            "risk_score": peak_risk["risk_score"],
            "risk_band": peak_risk["band"],
            "anomaly_count": len(anomalies),
            "high_risk_hours": sum(
                1 for x in risks if x["risk_score"] > 70
            ),
            "selected_date": date_str
        }

    def get_metrics(self):
        return {
            "baseline": {
                "mae": self.baseline_mae,
                "rmse": self.baseline_rmse,
                "mape": self.baseline_mape
            },
            "model": {
                "mae": self.mae,
                "rmse": self.rmse,
                "mape": self.mape
            }
        }
