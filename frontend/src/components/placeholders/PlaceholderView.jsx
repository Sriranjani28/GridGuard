import { DemoBadge } from '../common/DemoBanner';

/**
 * Section view for Model Performance & India Context
 */
export function PlaceholderView({ viewId, modelMetrics = {} }) {
  if (viewId === 'performance') {
    const baseline = modelMetrics?.baseline || { mae: 34.8, rmse: 48.2, mape: 7.9 };
    const model = modelMetrics?.model || { mae: 14.2, rmse: 21.6, mape: 3.1 };

    return (
      <div className="placeholder-view">
        <div className="placeholder-header">
          <div>
            <h2 className="placeholder-title">Model Performance & Evaluation</h2>
            <p className="placeholder-subtitle">
              Performance evaluation benchmark comparing baseline naive persistence against the GridGuard ensemble model.
            </p>
          </div>
          <DemoBadge />
        </div>

        {/* Metrics Comparison Grid */}
        <div className="metrics-compare-grid">
          <div className="metric-compare-card">
            <h3 className="metric-compare-title">Mean Absolute Error (MAE)</h3>
            <div className="metric-compare-values">
              <div className="compare-val-item">
                <span className="compare-label">Baseline</span>
                <span className="compare-num">{baseline.mae} <small>kW</small></span>
              </div>
              <div className="compare-val-item val-highlight">
                <span className="compare-label">GridGuard Model</span>
                <span className="compare-num">{model.mae} <small>kW</small></span>
                <span className="delta-badge">-59.2% Error</span>
              </div>
            </div>
          </div>

          <div className="metric-compare-card">
            <h3 className="metric-compare-title">Root Mean Squared Error (RMSE)</h3>
            <div className="metric-compare-values">
              <div className="compare-val-item">
                <span className="compare-label">Baseline</span>
                <span className="compare-num">{baseline.rmse} <small>kW</small></span>
              </div>
              <div className="compare-val-item val-highlight">
                <span className="compare-label">GridGuard Model</span>
                <span className="compare-num">{model.rmse} <small>kW</small></span>
                <span className="delta-badge">-55.1% Error</span>
              </div>
            </div>
          </div>

          <div className="metric-compare-card">
            <h3 className="metric-compare-title">Mean Absolute Percentage Error (MAPE)</h3>
            <div className="metric-compare-values">
              <div className="compare-val-item">
                <span className="compare-label">Baseline</span>
                <span className="compare-num">{baseline.mape}%</span>
              </div>
              <div className="compare-val-item val-highlight">
                <span className="compare-label">GridGuard Model</span>
                <span className="compare-num">{model.mape}%</span>
                <span className="delta-badge">-60.7% Error</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment specifications card */}
        <div className="deployment-specs-card">
          <h3 className="specs-card-title">Production Inference Runtime</h3>
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Model Architecture</span>
              <span className="spec-value">{modelMetrics?.architecture || 'LightGBM + LSTM Ensemble'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Inference Latency</span>
              <span className="spec-value">{modelMetrics?.inference_latency_ms || 4.2} ms / 24h batch</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Training Observations</span>
              <span className="spec-value">{modelMetrics?.training_samples?.toLocaleString() || '175,200'} hourly points</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Hardware Acceleration</span>
              <span className="spec-value">Integrated Neural Inference Engine</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // India Context view
  return (
    <div className="placeholder-view">
      <div className="placeholder-header">
        <div>
          <div className="title-with-pill">
            <h2 className="placeholder-title">India Grid & DISCOM Context</h2>
            <span className="coming-soon-pill">Coming soon</span>
          </div>
          <p className="placeholder-subtitle">
            Localized demand profiling, monsoon variability, and feeder-level stress indices for Indian state utilities.
          </p>
        </div>
        <DemoBadge />
      </div>

      <div className="india-context-cards">
        <div className="context-card">
          <div className="context-card-icon">⚡</div>
          <h3 className="context-card-title">DISCOM Feeder Telemetry</h3>
          <p className="context-card-desc">
            Integration with national SCADA protocols and state distribution companies (DISCOMs) to monitor substation 11kV/33kV distribution transformers.
          </p>
        </div>

        <div className="context-card">
          <div className="context-card-icon">☀️</div>
          <h3 className="context-card-title">Agricultural & Solar Peak Curves</h3>
          <p className="context-card-desc">
            Accounting for solar duck-curve dynamics in states like Gujarat and Maharashtra, and day/night agricultural pump feeder rotation schedules.
          </p>
        </div>

        <div className="context-card">
          <div className="context-card-icon">🌡️</div>
          <h3 className="context-card-title">Heatwave Cooling Surges</h3>
          <p className="context-card-desc">
            High-temperature sensitivity models calibrated to capture North and Central Indian urban cooling load ramps during peak May–June heatwaves.
          </p>
        </div>
      </div>
    </div>
  );
}
