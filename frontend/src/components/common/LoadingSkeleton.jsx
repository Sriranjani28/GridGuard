/**
 * Reusable animated placeholder skeleton for components while loading
 */
export function Skeleton({ width = '100%', height = '20px', borderRadius = '6px', className = '', style = {} }) {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton-card" aria-busy="true" aria-label="Loading metric">
      <Skeleton width="45%" height="16px" />
      <Skeleton width="75%" height="36px" style={{ margin: '12px 0 8px' }} />
      <Skeleton width="60%" height="14px" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="skeleton-chart" aria-busy="true" aria-label="Loading forecast chart">
      <div className="skeleton-header">
        <Skeleton width="30%" height="22px" />
        <Skeleton width="20%" height="18px" />
      </div>
      <Skeleton width="100%" height="280px" borderRadius="10px" />
    </div>
  );
}

export function TableSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-table" aria-busy="true" aria-label="Loading table data">
      <Skeleton width="100%" height="38px" borderRadius="6px" />
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton
          key={idx}
          width="100%"
          height="44px"
          borderRadius="6px"
          className="skeleton-row"
        />
      ))}
    </div>
  );
}
