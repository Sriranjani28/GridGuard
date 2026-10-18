"""Data Provider Seam for GridGuard Backend.

Provides a clean abstraction between FastAPI route handlers and underlying data sources.
Supports the deterministic DemoProvider today, with an architected seam ready for
the real IBM LinuxONE / ML CSV telemetry adapter.

================================================================================
FUTURE MODEL INTEGRATION ADAPTER SPECIFICATION (Teammate CSV Interface)
================================================================================
When the ML inference model generates `forecast_risk.csv`, the real provider
will read the CSV and map its columns to the frontend response schema:

CSV Column Mapping:
- `timestamp` (index) -> Parse ISO timestamp string YYYY-MM-DDTHH:00:00
- `kw`                -> actual_kw (float, None for future hours)
- `pred`              -> predicted_kw (float)
- `q95`               -> threshold_q95 (float)
- `risk`              -> risk_score (int, 0-100 proxy score)
- `band`              -> band ("Low" | "Medium" | "High")
- `z`                 -> z_score (float, residual standard deviations)
- `anom`              -> anomaly_flag (bool, True if |z| > 3.0)
- `volt_dip`          -> voltage_dip (bool)
- `wx`                -> weather_stress ("Moderate" | "Elevated")
- `pressure`          -> pressure index (int, 0-100)

Note: Do not implement CSV loading or LinuxONE socket networking until deployment
specifications and file permissions on the s390x node are finalized.
================================================================================
"""

from abc import ABC, abstractmethod
import os
from typing import Any, Dict, List
from demo_data import generate_daily_dataset


class BaseDataProvider(ABC):
    """Abstract interface for GridGuard telemetry and forecast data providers."""

    @abstractmethod
    def get_forecast(self, date_str: str) -> List[Dict[str, Any]]:
        """Return 24-hour electricity demand forecast."""
        pass

    @abstractmethod
    def get_risk(self, date_str: str) -> List[Dict[str, Any]]:
        """Return 24-hour overload risk scores (0-100 proxy index)."""
        pass

    @abstractmethod
    def get_anomalies(self, date_str: str) -> List[Dict[str, Any]]:
        """Return detected telemetry anomalies (|z| > 3.0 or voltage dips)."""
        pass

    @abstractmethod
    def get_summary(self, date_str: str) -> Dict[str, Any]:
        """Return top-level daily summary metrics."""
        pass

    @abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        """Return model evaluation metrics vs persistence baseline."""
        pass


class DemoProvider(BaseDataProvider):
    """Deterministic demo data provider generating synthetic profiles."""

    def get_forecast(self, date_str: str) -> List[Dict[str, Any]]:
        dataset = generate_daily_dataset(date_str)
        return dataset["forecast"]

    def get_risk(self, date_str: str) -> List[Dict[str, Any]]:
        dataset = generate_daily_dataset(date_str)
        return dataset["risk"]

    def get_anomalies(self, date_str: str) -> List[Dict[str, Any]]:
        dataset = generate_daily_dataset(date_str)
        return dataset["anomalies"]

    def get_summary(self, date_str: str) -> Dict[str, Any]:
        dataset = generate_daily_dataset(date_str)
        return dataset["summary"]

    def get_metrics(self) -> Dict[str, Any]:
        # Metrics are global model evaluation scores
        dataset = generate_daily_dataset("2026-10-17")
        return dataset["metrics"]


def get_data_provider() -> BaseDataProvider:
    """Factory to retrieve the active data provider according to DATA_SOURCE env var.
    
    Validates DATA_SOURCE at startup. Since only the demo provider is currently
    implemented, unsupported values are rejected with a ValueError.
    """
    source = os.getenv("DATA_SOURCE", "demo").lower().strip()
    if source == "demo":
        return DemoProvider()
    
    # Reject unsupported data sources clearly
    raise ValueError(
        f"Unsupported DATA_SOURCE='{source}'. Currently only 'demo' is implemented. "
        "Real ML / CSV telemetry provider will be enabled once forecast_risk.csv is connected."
    )
