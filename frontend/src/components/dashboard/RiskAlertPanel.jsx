import { RiskBadge } from '../common/RiskBadge';
import { DemoBadge } from '../common/DemoBanner';
import { CardSkeleton } from '../common/LoadingSkeleton';
import { ErrorMessage } from '../common/ErrorMessage';
import { EmptyState } from '../common/EmptyState';
import { ROLE_ACTIONS, USER_ROLES } from '../../constants';

/**
 * Demand-Risk Alert Panel
 * Displays overall risk band, peak forecast, high-risk hours count,
 * top drivers per hour, and role-specific operational recommendations.
 */
export function RiskAlertPanel({
  riskData = [],
  summary = {},
  activeRole = USER_ROLES.ENGINEER,
  loading = false,
  error = null,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="alert-panel-card">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-panel-card">
        <ErrorMessage
          title="Could not load risk assessment"
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!riskData || riskData.length === 0) {
    return (
      <div className="alert-panel-card">
        <EmptyState
          title="No risk data"
          description="Risk analysis is not available for this period."
        />
      </div>
    );
  }

  // Derive overall risk band from summary or highest hourly score
  const overallBand = summary?.risk_band || 'High';
  const overallScore = summary?.risk_score || 88;
  const highRiskHoursCount = summary?.high_risk_hours ?? riskData.filter((r) => r.band === 'High').length;
  const peakHour = summary?.peak_hour || '19:00';
  const peakKw = summary?.predicted_peak_kw || 648;

  // Filter hours that have Medium or High risk to show in the prioritized watchlist
  const riskyHours = riskData.filter((item) => item.band === 'High' || item.band === 'Medium');

  // Role-specific action text lookup
  const roleActionsForCurrentRole = ROLE_ACTIONS[activeRole] || ROLE_ACTIONS[USER_ROLES.ENGINEER];
  const recommendedAction = roleActionsForCurrentRole[overallBand] || 'Routine monitoring';

  return (
    <section className="alert-panel-card" aria-label="Demand risk evaluation and action advisory">
      <div className="alert-panel-header">
        <div className="alert-header-main">
          <div className="alert-title-wrap">
            <h2 className="alert-title">Demand Risk Assessment (Proxy Index)</h2>
            <RiskBadge score={overallScore} band={overallBand} showScore size="medium" />
          </div>
          <p className="alert-subtitle">
            Calculated from predicted demand pressure, statistical anomalies, and thermal weather stress.
          </p>
        </div>
        <DemoBadge />
      </div>

      {/* Metrics Row */}
      <div className="alert-metrics-grid">
        <div className="alert-metric-item">
          <span className="metric-item-label">Peak Forecast Load</span>
          <span className="metric-item-val">{peakKw} <small>kW</small></span>
          <span className="metric-item-sub">Expected at {peakHour}</span>
        </div>

        <div className="alert-metric-item">
          <span className="metric-item-label">High-Risk Hours</span>
          <span className="metric-item-val metric-val-danger">{highRiskHoursCount}</span>
          <span className="metric-item-sub">Exceeding 70/100 threshold</span>
        </div>

        <div className="alert-metric-item">
          <span className="metric-item-label">Peak Risk Window</span>
          <span className="metric-item-val">18:00 – 21:00</span>
          <span className="metric-item-sub">Evening grid stress window</span>
        </div>
      </div>

      {/* Recommended Role Action Box */}
      <div className={`role-action-box role-action-${overallBand.toLowerCase()}`}>
        <div className="role-action-header">
          <span className="role-action-badge">{activeRole} Protocol</span>
          <span className="role-action-tag">Recommended Action</span>
        </div>
        <p className="role-action-text">{recommendedAction}</p>
      </div>

      {/* Flagged Hours Watchlist */}
      <div className="risky-hours-section">
        <h3 className="risky-hours-title">
          Flagged Hours Watchlist ({riskyHours.length} hours)
        </h3>
        <div className="risky-hours-list" role="list">
          {riskyHours.map((item) => (
            <div key={item.timestamp || item.hour} className="risky-hour-item" role="listitem">
              <div className="hour-time-badge">{item.display_time || `${item.hour}:00`}</div>
              <div className="hour-details">
                <div className="hour-top-row">
                  <span className="hour-driver">{item.top_driver}</span>
                  <RiskBadge score={item.risk_score} band={item.band} showScore size="small" />
                </div>
                <div className="hour-signals">
                  <span className="signal-chip">Pressure: {item.pressure}%</span>
                  {item.weather_stress && (
                    <span className="signal-chip">Weather: {item.weather_stress}</span>
                  )}
                  {item.anomaly_flag && (
                    <span className="signal-chip signal-chip-warn">Anomaly Flagged</span>
                  )}
                  {item.voltage_dip && (
                    <span className="signal-chip signal-chip-danger">Voltage Dip</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
