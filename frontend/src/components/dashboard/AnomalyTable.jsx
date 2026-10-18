import { useState, useMemo } from 'react';
import { DemoBadge } from '../common/DemoBanner';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { ErrorMessage } from '../common/ErrorMessage';
import { EmptyState } from '../common/EmptyState';

/**
 * Anomaly Readings Table
 * Displays residual outliers with |z| > 3 and voltage dip events.
 * Sortable by timestamp, actual kW, and z-score.
 */
export function AnomalyTable({
  anomalies = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAnomalies = useMemo(() => {
    if (!anomalies || anomalies.length === 0) return [];
    const copy = [...anomalies];

    copy.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Handle strings vs numbers
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return copy;
  }, [anomalies, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="table-card">
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-card">
        <ErrorMessage
          title="Could not load anomaly readings"
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="table-card">
        <EmptyState
          title="No anomalies detected"
          description="All observed readings are within standard variance (|z| ≤ 3.0)."
          icon="✅"
        />
      </div>
    );
  }

  const renderSortIndicator = (field) => {
    if (sortField !== field) return <span className="sort-arrow-neutral">↕</span>;
    return sortDirection === 'asc' ? <span className="sort-arrow">↑</span> : <span className="sort-arrow">↓</span>;
  };

  return (
    <section className="table-card" aria-label="Anomaly readings table">
      <div className="table-card-header">
        <div className="table-title-group">
          <h2 className="table-title">Detected Telemetry Anomalies</h2>
          <span className="table-subtitle">
            Statistical outliers (|z| &gt; 3.0) and feeder voltage deviations flagged by model preprocessor.
          </span>
        </div>
        <div className="table-header-badges">
          <DemoBadge />
          <span className="anomaly-counter-badge">
            {anomalies.length} Flagged
          </span>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="anomaly-data-table">
          <thead>
            <tr>
              <th scope="col">
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleSort('timestamp')}
                  aria-sort={sortField === 'timestamp' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Timestamp {renderSortIndicator('timestamp')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleSort('actual_kw')}
                  aria-sort={sortField === 'actual_kw' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Actual kW {renderSortIndicator('actual_kw')}
                </button>
              </th>
              <th scope="col">Expected kW</th>
              <th scope="col">
                <button
                  type="button"
                  className="table-sort-btn"
                  onClick={() => handleSort('z_score')}
                  aria-sort={sortField === 'z_score' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Z-Score {renderSortIndicator('z_score')}
                </button>
              </th>
              <th scope="col">Reason</th>
              <th scope="col">Severity</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnomalies.map((item) => {
              const zVal = typeof item.z_score === 'number' ? item.z_score.toFixed(1) : item.z_score;
              const isPositive = item.z_score > 0;
              const severityClass = (item.severity || 'Medium').toLowerCase();

              return (
                <tr key={item.id || item.timestamp}>
                  <td className="cell-time">
                    <span className="time-primary">{item.display_time || item.timestamp?.slice(11, 16)}</span>
                    <span className="time-date">{item.timestamp?.slice(0, 10)}</span>
                  </td>
                  <td className="cell-mono font-bold">
                    {item.actual_kw != null ? `${item.actual_kw} kW` : '—'}
                  </td>
                  <td className="cell-mono text-muted">
                    {item.expected_kw != null ? `${item.expected_kw} kW` : '—'}
                  </td>
                  <td className="cell-mono">
                    <span className={`z-score-tag ${isPositive ? 'z-positive' : 'z-negative'}`}>
                      {isPositive ? `+${zVal}` : zVal}σ
                    </span>
                  </td>
                  <td>
                    <div className="reason-cell">
                      <span className="reason-title">{item.reason}</span>
                      {item.description && (
                        <span className="reason-desc">{item.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`severity-badge severity-${severityClass}`}>
                      {item.severity || 'Medium'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
