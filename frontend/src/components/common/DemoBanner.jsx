import { isDemoMode } from '../../services/api';

/**
 * Top-level persistent banner indicating offline / mock data mode.
 * Disappears automatically when VITE_USE_DEMO_DATA=false.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <aside
      className="demo-banner"
      role="region"
      aria-label="Demo data advisory"
    >
      <div className="demo-banner-content">
        <span className="demo-banner-icon" aria-hidden="true">⚠️</span>
        <strong className="demo-banner-tag">DEMO DATA — not real model output</strong>
        <span className="demo-banner-text">
          Showing deterministic synthetic profiles for testing & evaluation. Set <code>VITE_USE_DEMO_DATA=false</code> to connect to live API.
        </span>
      </div>
    </aside>
  );
}

/**
 * Small indicator badge placed inside individual cards & sections
 */
export function DemoBadge({ className = '' }) {
  if (!isDemoMode()) return null;

  return (
    <span
      className={`demo-badge ${className}`}
      title="Sample data for demonstration; not live telemetry"
      aria-label="Demo data indicator"
    >
      DEMO
    </span>
  );
}
