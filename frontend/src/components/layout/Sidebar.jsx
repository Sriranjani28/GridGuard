import { NAV_ITEMS } from '../../constants';

/**
 * Sidebar navigation component
 * Supports fixed layout on desktop and collapsible slide-in drawer on mobile.
 */
export function Sidebar({
  activeNav,
  onSelectNav,
  isOpen,
  onCloseMobile,
}) {
  const getNavIcon = (iconName) => {
    switch (iconName) {
      case 'dashboard':
        return '⚡';
      case 'trending-up':
        return '📈';
      case 'shield-alert':
        return '🛡️';
      case 'zap':
        return '⚠️';
      case 'activity':
        return '📊';
      case 'map-pin':
        return '🌐';
      default:
        return '•';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-inner">
          <div className="sidebar-section-title">Operations</div>
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <li key={item.id} className="nav-list-item">
                    <button
                      type="button"
                      className={`nav-button ${isActive ? 'nav-button-active' : ''}`}
                      onClick={() => {
                        onSelectNav(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        {getNavIcon(item.icon)}
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="nav-badge" aria-label={`Status: ${item.badge}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="disclaimer-note">
              Demand Risk is a synthetic proxy score (0-100), not actual outage telemetry.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
