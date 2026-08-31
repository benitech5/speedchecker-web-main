import {
  alertTypeLabel,
  formatAlertTime,
  formatRelativeTime,
  resolvePlate,
} from '../utils/alerts.js';

export default function AlertList({
  alerts,
  vehicles = [],
  onAcknowledge,
  acknowledgingId = null,
  compact = false,
  emptyMessage = 'No active alerts. Fleet is operating normally.',
}) {
  if (!alerts.length) {
    return <p className="fleet-empty">{emptyMessage}</p>;
  }

  return (
    <ul className={`alert-list${compact ? ' alert-list-compact' : ''}`}>
      {alerts.map((a) => {
        const plate = resolvePlate(a, vehicles);
        return (
          <li
            key={a.id}
            className={`alert-item severity-${a.severity}${a.acknowledged ? ' acknowledged' : ''}`}
          >
            <div className="alert-item-head">
              <span className={`severity-pill severity-${a.severity}`}>
                {a.severity === 'critical' ? 'CRITICAL' : a.severity === 'info' ? 'INFO' : 'WARNING'}
              </span>
              <span className="alert-type">{alertTypeLabel(a.type)}</span>
              <time dateTime={a.createdAt || undefined}>
                {compact ? formatRelativeTime(a.createdAt) : formatAlertTime(a.createdAt)}
              </time>
            </div>
            <p className="alert-message">{a.message}</p>
            <p className="alert-meta">
              <strong>{plate}</strong>
              {!a.acknowledged ? (
                <span className="alert-status-open"> · Open</span>
              ) : (
                <span className="alert-status-ack"> · Acknowledged</span>
              )}
              {a.latitude != null && a.longitude != null
                ? ` · ${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
                : ''}
            </p>
            {!a.acknowledged && onAcknowledge && (
              <button
                type="button"
                className="fleet-btn-sm"
                disabled={acknowledgingId === a.id}
                onClick={() => onAcknowledge(a.id)}
              >
                {acknowledgingId === a.id ? 'Acknowledging…' : 'Acknowledge'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
