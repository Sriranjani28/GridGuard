import { USER_ROLES } from '../../constants';
import { isDemoMode } from '../../services/api';

/**
 * Top Application Header
 * Includes logo, title, tagline, date selector, active role switcher, and mobile menu button.
 */
export function Header({
  activeRole,
  onRoleChange,
  selectedDate,
  onDateChange,
  isMobileNavOpen,
  onToggleMobileNav,
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={onToggleMobileNav}
          aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileNavOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <div className="brand-group">
          <div className="brand-title-wrap">
            <h1 className="brand-title">
              <span className="brand-accent">Grid</span>Guard
            </h1>
          </div>
          <p className="brand-tagline">Power Demand and Outage Risk Prediction</p>
        </div>
      </div>

      <div className="header-controls">
        {/* Date Selector */}
        <div className="control-item date-picker-item">
          <label htmlFor="forecast-date-input" className="control-label">
            Forecast Window
          </label>
          <input
            id="forecast-date-input"
            type="date"
            className="header-date-input"
            value={selectedDate} min="2006-12-24" max="2010-11-26"
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Select forecast date"
          />
        </div>

        {/* Role Selector */}
        <div className="control-item role-selector-item">
          <label htmlFor="user-role-select" className="control-label">
            Active Role
          </label>
          <select
            id="user-role-select"
            className="header-role-select"
            value={activeRole}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Select operational role for customized risk guidance"
          >
            {Object.values(USER_ROLES).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Connection status indicator */}
        <div className="connection-status" title={isDemoMode() ? 'Offline Demo Mode Active' : 'Connected to Live Forecasting API'}>
          <span className={`status-dot ${isDemoMode() ? 'status-dot-demo' : 'status-dot-live'}`} />
          <span className="status-label">{isDemoMode() ? 'DEMO' : 'LIVE'}</span>
        </div>
      </div>
    </header>
  );
}
