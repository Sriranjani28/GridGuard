"""Automated verification test suite for GridGuard FastAPI Backend.

Uses Python standard library (urllib.request, json) to test the running server
without requiring external test dependencies.
"""

import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://127.0.0.1:8000"


def request(url: str, headers: dict = None, method: str = "GET"):
    req = urllib.request.Request(url, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, dict(resp.headers), body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return e.code, dict(e.headers), body


def run_tests():
    print("=================================================================")
    print("GRIDGUARD BACKEND VERIFICATION TEST SUITE")
    print("=================================================================\n")

    results = []

    # 1. Health Endpoint
    status, headers, body = request(f"{BASE_URL}/health")
    data = json.loads(body)
    assert status == 200, f"Expected 200, got {status}"
    assert data["status"] == "ok"
    assert data["data_source"] == "demo"
    assert data["version"] == "0.1.0"
    print("[PASS] /health: Status 200 OK, data_source='demo', version='0.1.0'")
    results.append(("/health", "PASS", "HTTP 200, status=ok, data_source=demo"))

    # 2. CORS Preflight & Origin Header Check
    cors_headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    status, headers, _ = request(f"{BASE_URL}/api/summary", headers=cors_headers, method="OPTIONS")
    assert status == 200, f"Expected 200 for OPTIONS, got {status}"
    origin_header = headers.get("access-control-allow-origin") or headers.get("Access-Control-Allow-Origin")
    assert origin_header == "http://localhost:5173", f"Expected CORS header for http://localhost:5173, got {origin_header}"
    print(f"[PASS] CORS Check: Access-Control-Allow-Origin: {origin_header}")
    results.append(("CORS Preflight", "PASS", "Origin http://localhost:5173 accepted"))

    # 3. Test Dates: 2026-10-17, 2010-01-15, omitted date
    test_dates = ["2026-10-17", "2010-01-15", None]

    for d in test_dates:
        query = f"?date={d}" if d else ""
        date_label = d or "omitted (default 2026-10-17)"
        print(f"\n--- Testing with date: {date_label} ---")

        # GET /api/forecast
        status, headers, body = request(f"{BASE_URL}/api/forecast{query}", headers={"Origin": "http://localhost:5173"})
        assert status == 200
        x_source = headers.get("x-data-source") or headers.get("X-Data-Source")
        assert x_source == "demo", f"Expected X-Data-Source: demo, got {x_source}"
        forecast_data = json.loads(body)
        assert len(forecast_data) == 24, f"Expected 24 rows, got {len(forecast_data)}"
        for item in forecast_data:
            assert "timestamp" in item and "predicted_kw" in item and "threshold_q95" in item
            assert item["timestamp"].endswith(":00:00")
            assert isinstance(item["predicted_kw"], (int, float))
            assert isinstance(item["threshold_q95"], (int, float))
        print(f"[PASS] /api/forecast{query}: 24 rows, valid schema, X-Data-Source: demo")

        # GET /api/risk
        status, headers, body = request(f"{BASE_URL}/api/risk{query}")
        assert status == 200
        risk_data = json.loads(body)
        assert len(risk_data) == 24, f"Expected 24 rows, got {len(risk_data)}"
        high_risk_count = 0
        flagged_anom_timestamps = set()
        for item in risk_data:
            score = item["risk_score"]
            band = item["band"]
            assert 0 <= score <= 100, f"Score out of bounds: {score}"
            # Band rules verification (<40 Low, 40-70 Medium, >70 High)
            if score < 40:
                assert band == "Low", f"Score {score} had band {band}, expected Low"
            elif score <= 70:
                assert band == "Medium", f"Score {score} had band {band}, expected Medium"
            else:
                assert band == "High", f"Score {score} had band {band}, expected High"
                high_risk_count += 1

            if item["anomaly_flag"] or item["voltage_dip"]:
                flagged_anom_timestamps.add(item["timestamp"])

        print(f"[PASS] /api/risk{query}: 24 rows, band/score tiers verified, {high_risk_count} High-risk hours")

        # GET /api/anomalies
        status, headers, body = request(f"{BASE_URL}/api/anomalies{query}")
        assert status == 200
        anomalies_data = json.loads(body)
        anomaly_timestamps = {a["timestamp"] for a in anomalies_data}
        assert anomaly_timestamps == flagged_anom_timestamps, (
            f"Anomalies mismatch: {anomaly_timestamps} vs {flagged_anom_timestamps}"
        )
        for a in anomalies_data:
            assert abs(a["z_score"]) >= 3.0, f"Z-score should be |z| > 3.0: {a['z_score']}"
            assert a["reason"] in ("Demand spike", "Voltage dip")
            assert a["severity"] in ("Medium", "High")
        print(f"[PASS] /api/anomalies{query}: {len(anomalies_data)} anomalies match risk flags exactly (|z| > 3.0)")

        # GET /api/summary
        status, headers, body = request(f"{BASE_URL}/api/summary{query}")
        assert status == 200
        summary_data = json.loads(body)
        assert summary_data["anomaly_count"] == len(anomalies_data), (
            f"Summary anomaly count {summary_data['anomaly_count']} != {len(anomalies_data)}"
        )
        assert summary_data["high_risk_hours"] == high_risk_count, (
            f"Summary high_risk_hours {summary_data['high_risk_hours']} != {high_risk_count}"
        )
        assert 0 <= summary_data["risk_score"] <= 100
        assert summary_data["risk_band"] in ("Low", "Medium", "High")
        print(f"[PASS] /api/summary{query}: Summary metrics match risk and anomaly aggregations perfectly")

    # 4. GET /api/metrics
    status, headers, body = request(f"{BASE_URL}/api/metrics")
    assert status == 200
    metrics_data = json.loads(body)
    assert "baseline" in metrics_data and "model" in metrics_data
    assert metrics_data["model"]["mae"] < metrics_data["baseline"]["mae"]
    assert metrics_data["model"]["rmse"] < metrics_data["baseline"]["rmse"]
    assert metrics_data["model"]["mape"] < metrics_data["baseline"]["mape"]
    print("\n[PASS] /api/metrics: Model MAE/RMSE/MAPE lower than baseline")
    results.append(("/api/metrics", "PASS", "Model metrics exceed baseline"))

    # 5. Determinism Check (Two consecutive requests return identical JSON)
    print("\n--- Testing Determinism ---")
    _, _, body1 = request(f"{BASE_URL}/api/risk?date=2026-10-17")
    _, _, body2 = request(f"{BASE_URL}/api/risk?date=2026-10-17")
    assert body1 == body2, "Consecutive requests for same date differed!"
    print("[PASS] Determinism check: Two consecutive calls for 2026-10-17 returned byte-identical JSON")
    results.append(("Determinism", "PASS", "Identical outputs across requests"))

    # 6. Malformed Date Input Validation (HTTP 422)
    print("\n--- Testing Input Validation ---")
    status, headers, body = request(f"{BASE_URL}/api/forecast?date=bad-date-format")
    assert status == 422, f"Expected 422 for malformed date, got {status}"
    err_json = json.loads(body)
    assert "detail" in err_json, "Expected error 'detail' field"
    print(f"[PASS] Malformed Date Check: Returned HTTP 422 with detail: {err_json['detail']}")
    results.append(("Input Validation", "PASS", "HTTP 422 with clean JSON error"))

    print("\n=================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_tests()
