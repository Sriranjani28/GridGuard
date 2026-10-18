/**
 * GridGuard API Service Layer
 * 
 * ============================================================================
 * FASTAPI BACKEND API CONTRACT SPECIFICATION
 * ============================================================================
 * 
 * 1. GET /api/summary?date=YYYY-MM-DD
 *    Response format:
 *    {
 *      "current_kw": 530.0,
 *      "predicted_peak_kw": 648.0,
 *      "peak_hour": "19:00",
 *      "risk_score": 88,
 *      "risk_band": "High" | "Medium" | "Low",
 *      "anomaly_count": 3,
 *      "high_risk_hours": 3
 *    }
 * 
 * 2. GET /api/forecast?date=YYYY-MM-DD
 *    Response format:
 *    [
 *      {
 *        "timestamp": "2026-10-17T00:00:00",
 *        "actual_kw": 310.0,
 *        "predicted_kw": 315.0,
 *        "threshold_q95": 575.0
 *      },
 *      ...
 *    ]
 * 
 * 3. GET /api/risk?date=YYYY-MM-DD
 *    Response format:
 *    [
 *      {
 *        "timestamp": "2026-10-17T00:00:00",
 *        "risk_score": 24,
 *        "band": "Low" | "Medium" | "High",
 *        "top_driver": "Baseline night load",
 *        "pressure": 54,
 *        "anomaly_flag": false,
 *        "voltage_dip": false,
 *        "weather_stress": "Moderate" | "Elevated"
 *      },
 *      ...
 *    ]
 * 
 * 4. GET /api/anomalies?date=YYYY-MM-DD
 *    Response format:
 *    [
 *      {
 *        "timestamp": "2026-10-17T03:00:00",
 *        "actual_kw": 210.0,
 *        "expected_kw": 255.0,
 *        "z_score": -3.1,
 *        "reason": "Voltage dip" | "Demand spike",
 *        "severity": "Medium" | "High"
 *      },
 *      ...
 *    ]
 * 
 * 5. GET /api/metrics
 *    Response format:
 *    {
 *      "baseline": {
 *        "mae": 34.8,
 *        "rmse": 48.2,
 *        "mape": 7.9
 *      },
 *      "model": {
 *        "mae": 14.2,
 *        "rmse": 21.6,
 *        "mape": 3.1
 *      }
 *    }
 * ============================================================================
 */

import {
  getDemoSummary,
  getDemoForecast,
  getDemoRisk,
  getDemoAnomalies,
  getDemoModelMetrics,
} from '../mocks/demoData';

// Environment variable configuration
// VITE_USE_DEMO_DATA defaults to true unless explicitly set to 'false'
export const isDemoMode = () => {
  const envVal = import.meta.env.VITE_USE_DEMO_DATA;
  if (envVal === false || envVal === 'false') {
    return false;
  }
  return true;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Helper to fetch with timeout and standard error formatting
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let message = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const jsonErr = JSON.parse(errorText);
        if (jsonErr.detail || jsonErr.message) {
          message = jsonErr.detail || jsonErr.message;
        }
      } catch {
        // Fall back to HTTP status message
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`, { cause: err });
    }
    throw err;
  }
}

/**
 * Fetch top-level summary metrics
 * GET /api/summary?date=YYYY-MM-DD
 */
export async function getSummary(date) {
  if (isDemoMode()) {
    // Artificial small delay for realistic UX testing
    await new Promise((r) => setTimeout(r, 120));
    return getDemoSummary(date);
  }

  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return fetchWithTimeout(`${API_BASE_URL}/api/summary${query}`);
}

/**
 * Fetch 24-hour demand forecast
 * GET /api/forecast?date=YYYY-MM-DD
 */
export async function getForecast(date) {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 140));
    return getDemoForecast(date);
  }

  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return fetchWithTimeout(`${API_BASE_URL}/api/forecast${query}`);
}

/**
 * Fetch 24-hour overload risk scores
 * GET /api/risk?date=YYYY-MM-DD
 */
export async function getRisk(date) {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 150));
    return getDemoRisk(date);
  }

  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return fetchWithTimeout(`${API_BASE_URL}/api/risk${query}`);
}

/**
 * Fetch detected anomalies for the day
 * GET /api/anomalies?date=YYYY-MM-DD
 */
export async function getAnomalies(date) {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 130));
    return getDemoAnomalies(date);
  }

  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return fetchWithTimeout(`${API_BASE_URL}/api/anomalies${query}`);
}

/**
 * Fetch model performance metrics
 * GET /api/metrics
 */
export async function getModelMetrics() {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 100));
    return getDemoModelMetrics();
  }

  return fetchWithTimeout(`${API_BASE_URL}/api/metrics`);
}
