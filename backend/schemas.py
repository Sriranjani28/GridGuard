"""Pydantic schemas matching the GridGuard frontend API contract.

Notice:
GridGuard forecasts 24 hours of electricity demand (kW) and computes an explainable
Overload Risk Score (0-100 proxy index) per hour.
Never label anything 'outage probability' or 'outage prediction'.
Use 'Demand Risk' or 'Overload Risk'.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field("ok", description="Service health status")
    data_source: str = Field("demo", description="Active data source provider")
    version: str = Field("0.1.0", description="Backend service version")


class ForecastItem(BaseModel):
    timestamp: str = Field(..., description="ISO timestamp YYYY-MM-DDTHH:00:00")
    hour: str = Field(..., description="Two-digit hour string (00-23)")
    display_time: str = Field(..., description="Formatted hour string HH:00")
    actual_kw: Optional[float] = Field(None, description="Observed demand in kW (null for future hours)")
    predicted_kw: float = Field(..., description="Predicted demand in kW")
    threshold_q95: float = Field(..., description="Historical 95th percentile demand threshold in kW")


class RiskItem(BaseModel):
    timestamp: str = Field(..., description="ISO timestamp YYYY-MM-DDTHH:00:00")
    hour: str = Field(..., description="Two-digit hour string (00-23)")
    display_time: str = Field(..., description="Formatted hour string HH:00")
    risk_score: int = Field(..., ge=0, le=100, description="Overload Risk Score proxy index (0-100)")
    band: str = Field(..., description="Risk tier: Low (<40), Medium (40-70), or High (>70)")
    top_driver: str = Field(..., description="Primary explanatory component for the risk score")
    pressure: int = Field(..., ge=0, le=100, description="Demand pressure index (predicted/q95 clipped to 0-100)")
    anomaly_flag: bool = Field(..., description="True if residual |z| > 3.0")
    voltage_dip: bool = Field(..., description="True if feeder voltage dip event occurred")
    weather_stress: str = Field(..., description="'Moderate' or 'Elevated' thermal weather stress")
    z_score: float = Field(..., description="Residual z-score value")


class AnomalyItem(BaseModel):
    timestamp: str = Field(..., description="ISO timestamp YYYY-MM-DDTHH:00:00")
    display_time: str = Field(..., description="Formatted hour string HH:00")
    actual_kw: float = Field(..., description="Observed telemetry in kW")
    expected_kw: float = Field(..., description="Expected baseline/model demand in kW")
    z_score: float = Field(..., description="Residual z-score value (|z| > 3.0)")
    reason: str = Field(..., description="'Demand spike' or 'Voltage dip'")
    severity: str = Field(..., description="'Medium' or 'High'")
    description: Optional[str] = Field(None, description="Contextual explanation of the anomaly")


class SummaryResponse(BaseModel):
    current_kw: float = Field(..., description="Most recent observed demand in kW")
    current_hour: Optional[str] = Field(None, description="Hour of the most recent reading (e.g. '15:00')")
    predicted_peak_kw: float = Field(..., description="Maximum forecasted load in the 24h window (kW)")
    peak_hour: str = Field(..., description="Hour of forecasted peak demand (HH:00)")
    risk_score: int = Field(..., ge=0, le=100, description="Peak demand risk proxy score in the window")
    risk_band: str = Field(..., description="Risk band for the peak risk score ('Low', 'Medium', 'High')")
    anomaly_count: int = Field(..., ge=0, description="Count of detected anomalies in the 24h window")
    high_risk_hours: int = Field(..., ge=0, le=24, description="Number of hours with risk_score > 70")
    selected_date: Optional[str] = Field(None, description="Queried date string YYYY-MM-DD")


class MetricValues(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error in kW")
    rmse: float = Field(..., description="Root Mean Squared Error in kW")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")


class MetricsResponse(BaseModel):
    baseline: MetricValues = Field(..., description="Baseline persistence model metrics")
    model: MetricValues = Field(..., description="GridGuard ML ensemble model metrics")
