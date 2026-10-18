/**
 * GridGuard Constants & Domain Configuration
 */

export const RISK_THRESHOLDS = {
  LOW_MAX: 40,
  MEDIUM_MAX: 70,
};

export const RISK_BANDS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

/**
 * Determine risk band from score (0-100)
 * Low: below 40
 * Medium: 40-70
 * High: above 70
 */
export function getRiskBand(score) {
  if (score == null || isNaN(score)) return RISK_BANDS.LOW;
  if (score < RISK_THRESHOLDS.LOW_MAX) return RISK_BANDS.LOW;
  if (score <= RISK_THRESHOLDS.MEDIUM_MAX) return RISK_BANDS.MEDIUM;
  return RISK_BANDS.HIGH;
}

export const RISK_COLORS = {
  [RISK_BANDS.LOW]: {
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.4)',
    text: '#86EFAC',
  },
  [RISK_BANDS.MEDIUM]: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    text: '#FDE68A',
  },
  [RISK_BANDS.HIGH]: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#FCA5A5',
  },
};

export const USER_ROLES = {
  ENGINEER: 'Engineer',
  PLANNER: 'Planner',
  FACILITY: 'Facility Manager',
};

export const ROLE_ACTIONS = {
  [USER_ROLES.ENGINEER]: {
    [RISK_BANDS.LOW]: 'Routine monitoring',
    [RISK_BANDS.MEDIUM]: 'Watch flagged hours; review recent anomalies',
    [RISK_BANDS.HIGH]: 'Investigate anomalies now; prepare switching options',
  },
  [USER_ROLES.PLANNER]: {
    [RISK_BANDS.LOW]: 'No intervention needed',
    [RISK_BANDS.MEDIUM]: 'Pre-check spare capacity; identify transferable load',
    [RISK_BANDS.HIGH]: 'Prepare extra capacity; schedule load redistribution',
  },
  [USER_ROLES.FACILITY]: {
    [RISK_BANDS.LOW]: 'Normal operation',
    [RISK_BANDS.MEDIUM]: 'Pre-cool/pre-heat earlier; defer flexible loads',
    [RISK_BANDS.HIGH]: 'Curtail non-essential load during peak window',
  },
};

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'forecast', label: 'Forecast', icon: 'trending-up' },
  { id: 'risk', label: 'Risk Table', icon: 'shield-alert' },
  { id: 'anomalies', label: 'Anomalies', icon: 'zap' },
  { id: 'performance', label: 'Model Performance', icon: 'activity', placeholder: true },
  { id: 'india-context', label: 'India Context', icon: 'map-pin', placeholder: true, badge: 'Coming soon' },
];
