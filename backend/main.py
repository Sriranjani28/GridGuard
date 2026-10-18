"""GridGuard FastAPI Service.

Electricity demand forecasting and overload risk analysis service.
Deployed for the IBM Z Datathon on IBM LinuxONE / z16 architecture.

DEMO DATA ADVISORY:
Historical electricity demand is served using the trained ML model when DATA_SOURCE=ml.
Demand Risk is a synthetic proxy score (0-100), not actual outage telemetry.
"""

from datetime import datetime, timedelta
import os
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from data_provider import get_data_provider
from schemas import (
    AnomalyItem,
    ForecastItem,
    HealthResponse,
    MetricsResponse,
    RiskItem,
    SummaryResponse,
)

logger = logging.getLogger("gridguard.backend")

# Validate data provider configuration at startup
try:
    provider = get_data_provider()
except ValueError as e:
    logger.error("Startup error: %s", e)
    raise SystemExit(f"Configuration error: {e}")

DATA_SOURCE = os.getenv("DATA_SOURCE", "ml").lower().strip()
DEFAULT_DEMO_DATE = "2010-11-25" if DATA_SOURCE == "ml" else "2026-10-17"

app = FastAPI(
    title="GridGuard Forecasting & Risk API",
    description=(
        "GridGuard converts 24-hour electricity demand forecasts, statistical anomaly flags, "
        "and weather stress into an explainable Overload Risk Score (0-100 proxy index).\n\n"
        "DEMO DATA NOTICE: All responses currently return deterministic demo data for evaluation. "
        "The risk score is a proxy overload index, not an actual outage prediction."
    ),
    version="0.1.0",
)

# CORS Configuration: allow exact frontend dev server origins, GET and OPTIONS only
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Data-Source"],
)


@app.middleware("http")
async def add_custom_headers(request: Request, call_next):
    """Attach X-Data-Source: demo header to every /api/ response."""
    response: Response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["X-Data-Source"] = DATA_SOURCE
    return response


def _parse_and_validate_date(date: Optional[str]) -> str:
    """Validate date query string format (YYYY-MM-DD) or fallback to default benchmark date."""
    if not date:
        return DEFAULT_DEMO_DATE
    try:
        # Strict YYYY-MM-DD parsing
        parsed = datetime.strptime(date, "%Y-%m-%d")
        # Ensure year is reasonable
        if parsed.year < 2000 or parsed.year > 2100:
            raise ValueError("Year out of supported range (2000-2100)")
        if hasattr(provider, "start_date"):
            first_date = provider.start_date + timedelta(days=8)
            if parsed.date() < first_date or parsed.date() > provider.end_date:
                raise HTTPException(
                    status_code=422,
                    detail=f"Date must be between {first_date} and {provider.end_date}."
                )
        return date
    except HTTPException:
        raise
    except ValueError as err:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid date parameter '{date}'. Expected YYYY-MM-DD format (e.g. '2026-10-17').",
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure clean JSON errors without dumping raw server stack traces."""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred while processing telemetry data."},
    )


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """Service liveness and data source status check."""
    return HealthResponse(
        status="ok",
        data_source=DATA_SOURCE,
        version="0.1.0",
    )


@app.get("/api/summary", response_model=SummaryResponse, tags=["Telemetry"])
def get_summary(
    date: Optional[str] = Query(None, description="Forecast date in YYYY-MM-DD format"),
) -> SummaryResponse:
    """Top-level operational KPI summary metrics for the given date window."""
    valid_date = _parse_and_validate_date(date)
    data = provider.get_summary(valid_date)
    return SummaryResponse(**data)


@app.get("/api/forecast", response_model=List[ForecastItem], tags=["Telemetry"])
def get_forecast(
    date: Optional[str] = Query(None, description="Forecast date in YYYY-MM-DD format"),
) -> List[ForecastItem]:
    """24-hour observed vs predicted electricity demand trajectory (kW)."""
    valid_date = _parse_and_validate_date(date)
    data = provider.get_forecast(valid_date)
    return [ForecastItem(**item) for item in data]


@app.get("/api/risk", response_model=List[RiskItem], tags=["Telemetry"])
def get_risk(
    date: Optional[str] = Query(None, description="Forecast date in YYYY-MM-DD format"),
) -> List[RiskItem]:
    """24-hour explainable Demand Overload Risk Scores (0-100 proxy index)."""
    valid_date = _parse_and_validate_date(date)
    data = provider.get_risk(valid_date)
    return [RiskItem(**item) for item in data]


@app.get("/api/anomalies", response_model=List[AnomalyItem], tags=["Telemetry"])
def get_anomalies(
    date: Optional[str] = Query(None, description="Forecast date in YYYY-MM-DD format"),
) -> List[AnomalyItem]:
    """Detected telemetry anomalies (|z| > 3.0 or feeder voltage dips)."""
    valid_date = _parse_and_validate_date(date)
    data = provider.get_anomalies(valid_date)
    return [AnomalyItem(**item) for item in data]


@app.get("/api/metrics", response_model=MetricsResponse, tags=["Telemetry"])
def get_metrics() -> MetricsResponse:
    """Model performance benchmarks comparing baseline persistence vs GridGuard ensemble."""
    data = provider.get_metrics()
    return MetricsResponse(**data)
