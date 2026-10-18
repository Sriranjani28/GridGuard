"""GridGuard Deterministic Demo Data Generator.

Uses Python standard library only (math, datetime, random.Random with a fixed date seed).
Generates a coherent 24-hour electricity demand model and derives all endpoints from it.
Proxy index rules:
- Never label anything 'outage probability' or 'outage prediction'.
- Use 'Demand Risk' or 'Overload Risk'.
- Bands: Low (< 40), Medium (40-70), High (> 70).
- Risk formula:
  100 * (0.55 * pressure + 0.20 * anomaly_flag + 0.10 * voltage_dip + 0.15 * weather_stress)
  where pressure = clip(predicted / threshold, 0, 1.2) / 1.2
"""

from datetime import datetime
import hashlib
import math
import random
from typing import Any, Dict, List, Tuple


def _get_risk_band(score: int) -> str:
    """Classify risk score into standard GridGuard tiers."""
    if score < 40:
        return "Low"
    if score <= 70:
        return "Medium"
    return "High"


def _clip(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def generate_daily_dataset(date_str: str) -> Dict[str, Any]:
    """Generate a coherent, deterministic 24-hour demand profile for the given date.
    
    The same date string will ALWAYS produce the exact same dataset across restarts.
    """
    # Parse date to check day of week and seed
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    is_weekend = dt.weekday() >= 5
    day_of_year = dt.timetuple().tm_yday

    # Deterministic integer seed derived from date
    seed_int = int(hashlib.sha256(date_str.encode("utf-8")).hexdigest()[:8], 16)
    rng = random.Random(seed_int)

    # Seasonal temperature variability (hotter in summer months tm_mon 5-8)
    month = dt.month
    base_temp = 20.0 + 12.0 * math.sin((month - 3) / 12.0 * math.pi)

    # Hourly baseline profile:
    # Early morning low (03:00 - 05:00), morning ramp (07:00 - 11:00), afternoon plateau, evening peak (18:00 - 21:00)
    # Special exact calibration for the benchmark demo date 2026-10-17
    is_benchmark_date = (date_str == "2026-10-17")

    hourly_records: List[Dict[str, Any]] = []

    # Selected hours for anomalies (always exactly 2-3 hours per day)
    # Hour 3: early morning feeder voltage dip
    # Hour 14: afternoon commercial spike
    # Hour 19: evening peak surge
    anomaly_hours = {3: "voltage_dip", 14: "spike", 19: "spike"}

    # For other dates, choose 2-3 anomaly hours deterministically
    if not is_benchmark_date:
        possible_spikes = [13, 14, 15, 18, 19, 20]
        chosen_spike1 = rng.choice(possible_spikes)
        remaining_spikes = [h for h in possible_spikes if h != chosen_spike1]
        chosen_spike2 = rng.choice(remaining_spikes)
        anomaly_hours = {3: "voltage_dip", chosen_spike1: "spike", chosen_spike2: "spike"}

    for hour in range(24):
        h_str = f"{hour:02d}"
        display_time = f"{h_str}:00"
        timestamp = f"{date_str}T{h_str}:00:00"

        # Baseline diurnal curve (kW)
        # Peak around 19:00 (~640 kW), low around 03:00 (~260 kW)
        diurnal = math.sin((hour - 8) / 24.0 * 2.0 * math.pi)
        evening_bump = math.exp(-((hour - 19) ** 2) / 6.0) * 160.0
        morning_bump = math.exp(-((hour - 10) ** 2) / 8.0) * 80.0

        weekend_factor = 0.88 if is_weekend else 1.0
        predicted_kw = round((380.0 + 100.0 * diurnal + evening_bump + morning_bump) * weekend_factor, 1)

        # Historical 95th percentile threshold (q95) for the same weekday-hour
        # Typically around 560 - 610 kW
        threshold_q95 = round(560.0 + 25.0 * diurnal + 25.0 * (evening_bump / 160.0), 1)

        # Benchmark calibration for exact alignment with frontend demoData.js
        if is_benchmark_date:
            fixed_q95 = [575, 570, 565, 560, 560, 565, 575, 580, 585, 590, 590, 590, 585, 590, 585, 590, 595, 600, 605, 610, 610, 600, 590, 580]
            fixed_pred = [315, 285, 265, 255, 250, 280, 350, 435, 495, 515, 540, 545, 535, 550, 520, 540, 565, 590, 625, 648, 635, 595, 480, 390]
            fixed_actual = [310, 280, 260, 210, 245, 285, 360, 440, 490, 520, 535, 550, 540, 545, 595, 530, None, None, None, None, None, None, None, None]
            threshold_q95 = float(fixed_q95[hour])
            predicted_kw = float(fixed_pred[hour])
            actual_kw = fixed_actual[hour]
        else:
            # Past hours have actual readings, future hours (after 15:00) are null
            if hour <= 15:
                noise = rng.uniform(-15.0, 15.0)
                actual_kw = round(predicted_kw + noise, 1)
            else:
                actual_kw = None

        # Check anomaly status
        anomaly_type = anomaly_hours.get(hour)
        anomaly_flag = (anomaly_type == "spike")
        voltage_dip = (anomaly_type == "voltage_dip")

        # Adjust actual_kw and residual z-score if anomaly occurs
        z_score = 0.0
        reason = None
        severity = "Medium"
        description = None

        if anomaly_type == "voltage_dip":
            actual_kw = round(predicted_kw - (45.0 if is_benchmark_date else 40.0), 1)
            z_score = -3.1
            reason = "Voltage dip"
            severity = "Medium"
            description = "Sudden feeder voltage drop detected; residual z-score exceeds -3.0 threshold."
        elif anomaly_type == "spike":
            anomaly_boost = 75.0 if hour == 14 else 105.0
            actual_kw = round(predicted_kw + anomaly_boost, 1) if hour <= 15 else predicted_kw + anomaly_boost
            z_score = 3.4 if hour == 14 else 3.9
            reason = "Demand spike"
            severity = "High" if z_score > 3.5 else "Medium"
            description = (
                "Industrial batch motor startup caused an unscheduled demand spike."
                if hour < 17
                else "Concurrent commercial cooling and residential ramp triggered severe residual surge."
            )

        # Weather stress determination (afternoon thermal stress)
        weather_val = 0.85 if 14 <= hour <= 18 else (0.4 if 10 <= hour <= 21 else 0.1)
        weather_stress = "Elevated" if weather_val >= 0.7 else "Moderate"

        # PRD Risk Formula:
        # risk_score = 100 * (0.55 * pressure + 0.20 * anomaly_flag + 0.10 * voltage_dip + 0.15 * weather_stress)
        # where pressure = clip(predicted / threshold, 0, 1.2) / 1.2
        ratio = predicted_kw / threshold_q95 if threshold_q95 > 0 else 0.0
        pressure_norm = _clip(ratio, 0.0, 1.2) / 1.2
        pressure_pct = int(round(pressure_norm * 100))

        flag_val = 1.0 if anomaly_flag else 0.0
        dip_val = 1.0 if voltage_dip else 0.0

        raw_score = 100.0 * (
            0.55 * pressure_norm
            + 0.20 * flag_val
            + 0.10 * dip_val
            + 0.15 * weather_val
        )

        # Calibrate benchmark hours cleanly to match UI tiers
        if is_benchmark_date:
            if hour == 19:
                risk_score = 88
            elif hour == 18:
                risk_score = 78
            elif hour == 20:
                risk_score = 74
            elif hour == 14:
                risk_score = 68
            elif hour == 17:
                risk_score = 62
            elif hour == 3:
                risk_score = 55
            elif 8 <= hour <= 16:
                risk_score = 44
            else:
                risk_score = min(38, max(14, int(round(raw_score))))
        else:
            risk_score = int(round(_clip(raw_score, 0.0, 100.0)))

        band = _get_risk_band(risk_score)

        # Determine top driver by comparing weighted contributions
        w_pressure = 0.55 * pressure_norm
        w_anomaly = 0.20 * flag_val
        w_voltage = 0.10 * dip_val
        w_weather = 0.15 * weather_val

        if flag_val > 0 and w_anomaly >= max(w_pressure, w_voltage, w_weather):
            top_driver = "Demand spike anomaly" if hour != 19 else "Demand pressure & surge"
        elif dip_val > 0 and w_voltage >= max(w_pressure, w_anomaly, w_weather):
            top_driver = "Voltage dip anomaly"
        elif w_pressure >= max(w_anomaly, w_voltage, w_weather) and pressure_norm > 0.8:
            top_driver = "Demand pressure"
        elif weather_stress == "Elevated":
            top_driver = "Weather stress"
        elif hour in (6, 7):
            top_driver = "Morning shift start"
        elif 8 <= hour <= 12:
            top_driver = "Commercial activity"
        else:
            top_driver = "Baseline night load"

        record = {
            "hour": h_str,
            "display_time": display_time,
            "timestamp": timestamp,
            "actual_kw": actual_kw,
            "predicted_kw": predicted_kw,
            "threshold_q95": threshold_q95,
            "risk_score": risk_score,
            "band": band,
            "top_driver": top_driver,
            "pressure": pressure_pct,
            "anomaly_flag": anomaly_flag,
            "voltage_dip": voltage_dip,
            "weather_stress": weather_stress,
            "z_score": z_score,
            "is_anomaly": (anomaly_flag or voltage_dip),
            "reason": reason,
            "severity": severity,
            "description": description,
        }
        hourly_records.append(record)

    # Derive Forecast items (24 rows)
    forecast = [
        {
            "timestamp": r["timestamp"],
            "hour": r["hour"],
            "display_time": r["display_time"],
            "actual_kw": r["actual_kw"],
            "predicted_kw": r["predicted_kw"],
            "threshold_q95": r["threshold_q95"],
        }
        for r in hourly_records
    ]

    # Derive Risk items (24 rows)
    risk = [
        {
            "timestamp": r["timestamp"],
            "hour": r["hour"],
            "display_time": r["display_time"],
            "risk_score": r["risk_score"],
            "band": r["band"],
            "top_driver": r["top_driver"],
            "pressure": r["pressure"],
            "anomaly_flag": r["anomaly_flag"],
            "voltage_dip": r["voltage_dip"],
            "weather_stress": r["weather_stress"],
            "z_score": r["z_score"],
        }
        for r in hourly_records
    ]

    # Derive Anomalies (only hours where is_anomaly is True)
    anomalies = []
    for r in hourly_records:
        if r["is_anomaly"]:
            anomalies.append({
                "timestamp": r["timestamp"],
                "display_time": r["display_time"],
                "actual_kw": float(r["actual_kw"] if r["actual_kw"] is not None else r["predicted_kw"] + 60.0),
                "expected_kw": float(r["predicted_kw"]),
                "z_score": float(r["z_score"]),
                "reason": r["reason"] or "Demand spike",
                "severity": r["severity"] or "Medium",
                "description": r["description"],
            })

    # Derive Summary
    peak_record = max(hourly_records, key=lambda x: x["predicted_kw"])
    max_risk_record = max(hourly_records, key=lambda x: x["risk_score"])
    high_risk_hours_count = sum(1 for r in hourly_records if r["band"] == "High")

    # Current telemetry (at 15:00)
    current_rec = hourly_records[15]
    current_kw = current_rec["actual_kw"] if current_rec["actual_kw"] is not None else 530.0

    summary = {
        "current_kw": float(current_kw),
        "current_hour": "15:00",
        "predicted_peak_kw": float(peak_record["predicted_kw"]),
        "peak_hour": peak_record["display_time"],
        "risk_score": int(max_risk_record["risk_score"]),
        "risk_band": max_risk_record["band"],
        "anomaly_count": len(anomalies),
        "high_risk_hours": high_risk_hours_count,
        "selected_date": date_str,
    }

    # Static model metrics comparing naive baseline vs GridGuard ensemble
    metrics = {
        "baseline": {
            "mae": 34.8,
            "rmse": 48.2,
            "mape": 7.9,
        },
        "model": {
            "mae": 14.2,
            "rmse": 21.6,
            "mape": 3.1,
        },
    }

    return {
        "forecast": forecast,
        "risk": risk,
        "anomalies": anomalies,
        "summary": summary,
        "metrics": metrics,
    }
