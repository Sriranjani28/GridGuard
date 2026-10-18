/**
 * Standardized error display with retry callback
 */
export function ErrorMessage({ title = 'Unable to load data', message, onRetry }) {
  return (
    <div className="error-container" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h3 className="error-title">{title}</h3>
      {message && <p className="error-message">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-retry"
          aria-label="Retry loading data"
        >
          <span aria-hidden="true">🔄</span> Try Again
        </button>
      )}
    </div>
  );
}
