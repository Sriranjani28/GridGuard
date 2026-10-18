/**
 * GridGuard Deterministic Demo Data
 * All sample values for offline / mock testing are defined here.
 * Notice: This data is for demonstration and proxy risk testing only.
 */

import { getRiskBand } from '../constants';

const DEMO_DATE = '2026-10-17';

// 24-hour deterministic base profile (hourly demand in kW)
// Peak occurs in the evening (18:00 - 21:00), dipping in early morning (03:00 - 05:00)
const HOURLY_PATTERNS = [
  { hour: 0, actual: 310, predicted: 315, q95: 575, weather: 22, driver: 'Baseline night load' },
  { hour: 1, actual: 280, predicted: 285, q95: 570, weather: 21, driver: 'Baseline night load' },
  { hour: 2, actual: 260, predicted: 265, q95: 565, driver: 'Baseline night load' },
  { hour: 3, actual: 210, predicted: 255, q95: 560, driver: 'Voltage dip anomaly', anomaly: true, voltageDip: true, zScore: -3.1 },
  { hour: 4, actual: 245, predicted: 250, q95: 560, driver: 'Baseline night load' },
  { hour: 5, actual: 285, predicted: 280, q95: 565, driver: 'Early morning ramp' },
  { hour: 6, actual: 360, predicted: 350, q95: 575, driver: 'Morning shift start' },
  { hour: 7, actual: 440, predicted: 435, q95: 580, driver: 'Commercial morning ramp' },
  { hour: 8, actual: 490, predicted: 495, q95: 585, driver: 'HVAC & commercial load' },
  { hour: 9, actual: 520, predicted: 515, q95: 590, driver: 'Commercial activity' },
  { hour: 10, actual: 535, predicted: 540, q95: 590, driver: 'Industrial processing' },
  { hour: 11, actual: 550, predicted: 545, q95: 590, driver: 'Midday load' },
  { hour: 12, actual: 540, predicted: 535, q95: 585, driver: 'Midday plateau' },
  { hour: 13, actual: 545, predicted: 550, q95: 590, driver: 'Afternoon operations' },
  { hour: 14, actual: 595, predicted: 520, q95: 585, driver: 'Demand spike anomaly', anomaly: true, zScore: 3.4 },
  { hour: 15, actual: 530, predicted: 540, q95: 590, driver: 'Weather stress' },
  { hour: 16, actual: null, predicted: 565, q95: 595, driver: 'Thermal buildup & HVAC' },
  { hour: 17, actual: null, predicted: 590, q95: 600, driver: 'Evening commercial ramp' },
  { hour: 18, actual: null, predicted: 625, q95: 605, driver: 'Demand pressure' }, // crosses q95
  { hour: 19, actual: null, predicted: 648, q95: 610, driver: 'Demand pressure & surge', anomaly: true, zScore: 3.9 }, // crosses q95 & high risk
  { hour: 20, actual: null, predicted: 635, q95: 610, driver: 'Demand pressure' }, // crosses q95
  { hour: 21, actual: null, predicted: 595, q95: 600, driver: 'Evening peak residual' },
  { hour: 22, actual: null, predicted: 480, q95: 590, driver: 'Load decline' },
  { hour: 23, actual: null, predicted: 390, q95: 580, driver: 'Night ramp-down' },
];

/**
 * Deterministic generator for 24-hour forecast
 */
export function getDemoForecast(dateStr = DEMO_DATE) {
  return HOURLY_PATTERNS.map(({ hour, actual, predicted, q95 }) => {
    const formattedHour = String(hour).padStart(2, '0');
    return {
      timestamp: `${dateStr}T${formattedHour}:00:00`,
      hour: formattedHour,
      display_time: `${formattedHour}:00`,
      actual_kw: actual,
      predicted_kw: predicted,
      threshold_q95: q95,
      exceeds_threshold: predicted > q95,
    };
  });
}

/**
 * Deterministic generator for 24-hour overload risk scores
 */
export function getDemoRisk(dateStr = DEMO_DATE) {
  return HOURLY_PATTERNS.map(({ hour, predicted, q95, driver, anomaly, voltageDip, zScore }) => {
    const formattedHour = String(hour).padStart(2, '0');
    // Calculate synthetic explainable risk score (0-100)
    // Components: Demand pressure (ratio of predicted to q95), weather, anomaly flag
    const pressureScore = Math.max(0, Math.min(60, Math.round((predicted / q95) * 50)));
    const weatherScore = (hour >= 14 && hour <= 18) ? 18 : 6;
    const anomalyScore = anomaly ? (voltageDip ? 25 : 30) : 0;

    let totalScore = Math.min(100, Math.round(pressureScore + weatherScore + anomalyScore));
    // Calibrate specific hours to match risk tiers cleanly
    if (hour === 19) totalScore = 88; // High
    else if (hour === 18) totalScore = 78; // High
    else if (hour === 20) totalScore = 74; // High
    else if (hour === 14) totalScore = 68; // Medium
    else if (hour === 17) totalScore = 62; // Medium
    else if (hour === 3) totalScore = 55; // Medium (due to voltage dip)
    else if (hour >= 8 && hour <= 16) totalScore = 44; // Medium
    else totalScore = Math.min(38, Math.max(12, totalScore)); // Low

    const band = getRiskBand(totalScore);

    return {
      timestamp: `${dateStr}T${formattedHour}:00:00`,
      hour: formattedHour,
      display_time: `${formattedHour}:00`,
      risk_score: totalScore,
      band,
      top_driver: driver || 'Normal operational range',
      pressure: Math.round((predicted / q95) * 100),
      anomaly_flag: Boolean(anomaly),
      voltage_dip: Boolean(voltageDip),
      weather_stress: weatherScore > 10 ? 'Elevated' : 'Moderate',
      z_score: zScore || 0,
    };
  });
}

/**
 * Deterministic generator for anomalies
 */
export function getDemoAnomalies(dateStr = DEMO_DATE) {
  return [
    {
      id: 'anom-01',
      timestamp: `${dateStr}T03:00:00`,
      display_time: '03:00',
      actual_kw: 210,
      expected_kw: 255,
      residual_kw: -45,
      z_score: -3.1,
      reason: 'Voltage dip',
      severity: 'Medium',
      phase: 'Night baseline',
      description: 'Sudden feeder voltage drop detected; residual z-score exceeds -3.0 threshold.',
    },
    {
      id: 'anom-02',
      timestamp: `${dateStr}T14:00:00`,
      display_time: '14:00',
      actual_kw: 595,
      expected_kw: 520,
      residual_kw: 75,
      z_score: 3.4,
      reason: 'Demand spike',
      severity: 'High',
      phase: 'Afternoon operations',
      description: 'Industrial batch motor startup caused an unscheduled +75 kW spike.',
    },
    {
      id: 'anom-03',
      timestamp: `${dateStr}T19:00:00`,
      display_time: '19:00',
      actual_kw: 655,
      expected_kw: 550,
      residual_kw: 105,
      z_score: 3.9,
      reason: 'Demand spike',
      severity: 'High',
      phase: 'Evening peak window',
      description: 'Concurrent commercial cooling and residential ramp triggered severe residual surge.',
    },
  ];
}

/**
 * Deterministic generator for top-level summary metrics
 */
export function getDemoSummary(dateStr = DEMO_DATE) {
  const forecast = getDemoForecast(dateStr);
  const risk = getDemoRisk(dateStr);
  const anomalies = getDemoAnomalies(dateStr);

  const highRiskHours = risk.filter((r) => r.band === 'High').length;
  const peakForecast = forecast.reduce(
    (max, item) => (item.predicted_kw > max.predicted_kw ? item : max),
    forecast[0]
  );

  return {
    current_kw: 530, // Most recent recorded actual kW
    current_hour: '15:00',
    predicted_peak_kw: peakForecast.predicted_kw,
    peak_hour: peakForecast.display_time,
    risk_score: 88, // Peak demand risk score (or current window score)
    risk_band: 'High',
    anomaly_count: anomalies.length,
    high_risk_hours: highRiskHours,
    selected_date: dateStr,
  };
}

/**
 * Deterministic generator for Model Performance placeholder
 */
export function getDemoModelMetrics() {
  return {
    baseline: {
      mae: 34.8,
      rmse: 48.2,
      mape: 7.9,
    },
    model: {
      mae: 14.2,
      rmse: 21.6,
      mape: 3.1,
    },
    architecture: 'LightGBM + LSTM Ensemble',
    training_samples: 175200,
    inference_latency_ms: 4.2,
    last_trained: '2026-10-15 04:00 UTC',
  };
}
