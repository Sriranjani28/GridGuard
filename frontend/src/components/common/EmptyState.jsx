/**
 * Standard empty state presentation
 */
export function EmptyState({
  title = 'No data available',
  description = 'There are no records to display for the selected parameters.',
  icon = '📊',
}) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
    </div>
  );
}
