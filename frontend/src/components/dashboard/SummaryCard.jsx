import { RiskBadge } from '../common/RiskBadge';
import { DemoBadge } from '../common/DemoBanner';

/**
 * Summary KPI Card for the top metrics row
 */
export function SummaryCard({
  title,
  value,
  unit,
  subtitle,
  badgeContent,
  icon,
  trend,
  isRisk = false,
  riskBand,
  riskScore,
}) {
  return (
    <article className="summary-card" aria-label={title}>
      <div className="card-header-row">
        <div className="card-title-group">
          {icon && <span className="card-icon" aria-hidden="true">{icon}</span>}
          <h2 className="card-title">{title}</h2>
        </div>
        <div className="card-header-badges">
          <DemoBadge />
          {badgeContent}
        </div>
      </div>

      <div className="card-body">
        <div className="card-metric-value-wrap">
          <span className="card-metric-value">{value}</span>
          {unit && <span className="card-metric-unit">{unit}</span>}
        </div>

        {isRisk && (
          <div className="card-risk-badge-wrap">
            <RiskBadge score={riskScore} band={riskBand} size="medium" />
          </div>
        )}

        {subtitle && <p className="card-subtitle">{subtitle}</p>}

        {trend && (
          <div className={`card-trend card-trend-${trend.direction}`}>
            <span aria-hidden="true">{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    </article>
  );
}
