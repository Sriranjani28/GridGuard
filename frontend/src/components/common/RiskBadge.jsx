import { getRiskBand } from '../../constants';

/**
 * RiskBadge component renders an accessible badge with textual band + color semantics.
 */
export function RiskBadge({ score, band, showScore = false, size = 'medium' }) {
  const resolvedBand = band || getRiskBand(score);
  const bandClass = resolvedBand.toLowerCase();

  return (
    <span
      className={`risk-badge risk-badge-${bandClass} risk-badge-${size}`}
      role="status"
      aria-label={`Risk band: ${resolvedBand}${score != null ? `, score: ${score}` : ''}`}
    >
      <span className="risk-badge-dot" aria-hidden="true" />
      <span className="risk-badge-text">{resolvedBand}</span>
      {showScore && score != null && (
        <span className="risk-badge-score">({score})</span>
      )}
    </span>
  );
}
