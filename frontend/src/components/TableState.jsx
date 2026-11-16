import { AlertCircle } from 'lucide-react'

/** Loading / error / empty block shown in place of table rows. */
export default function TableState({ loading, error, empty, emptyText = 'Nothing to show yet.', onRetry }) {
  if (loading) {
    return (
      <div className="state-box">
        <span className="spinner" style={{ color: 'var(--royal)' }} />
        <span>Loading…</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="state-box error">
        <AlertCircle size={22} />
        <span>{error}</span>
        {onRetry && (
          <button type="button" className="btn btn-outline" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    )
  }
  if (empty) return <div className="state-box">{emptyText}</div>
  return null
}
