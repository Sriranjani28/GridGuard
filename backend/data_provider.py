"""GridGuard data provider selection."""

import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from demo_data import generate_daily_dataset
from ml_provider import MLProvider


class BaseDataProvider(ABC):

    @abstractmethod
    def get_forecast(self, date_str: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_risk(self, date_str: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_anomalies(self, date_str: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_summary(self, date_str: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_metrics(self) -> Dict[str, Any]:
        pass


class DemoProvider(BaseDataProvider):

    def get_forecast(self, date_str):
        return generate_daily_dataset(date_str)["forecast"]

    def get_risk(self, date_str):
        return generate_daily_dataset(date_str)["risk"]

    def get_anomalies(self, date_str):
        return generate_daily_dataset(date_str)["anomalies"]

    def get_summary(self, date_str):
        return generate_daily_dataset(date_str)["summary"]

    def get_metrics(self):
        return generate_daily_dataset("2026-10-17")["metrics"]


class RealMLProvider(MLProvider, BaseDataProvider):
    """Provider using the trained GridGuard demand forecasting model."""


def get_data_provider():
    source = os.getenv("DATA_SOURCE", "ml").lower().strip()

    if source == "demo":
        return DemoProvider()

    if source == "ml":
        return RealMLProvider()

    raise ValueError(
        f"Unsupported DATA_SOURCE='{source}'. Use 'ml' or 'demo'."
    )
