import { useMemo, useState } from 'react';
import { useAlerts } from '../hooks/useAlerts.js';
import { useLiveFleet } from '../hooks/useLiveFleet.js';
import AlertList from '../components/AlertList.jsx';
import { countBySeverity } from '../utils/alerts.js';

export default function AlertsPage() {
  const { alerts, loading, error, ackError, acknowledgingId, acknowledge } = useAlerts();
  const { vehicles } = useLiveFleet({ enablePolling: false });
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => countBySeverity(alerts), [alerts]);

  const filtered = useMemo(() => {
    if (filter === 'critical') return alerts.filter((a) => a.severity === 'critical');
    if (filter === 'warning') return alerts.filter((a) => a.severity === 'warning' || a.severity === 'info');
    if (filter === 'open') return alerts.filter((a) => !a.acknowledged);
    return alerts;
  }, [alerts, filter]);

  // Newest first
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [filtered],
  );

  return (
    <div className="fleet-page">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">INCIDENTS</p>
          <h1>Fleet Alerts</h1>
          <p className="fleet-muted">Backend rule detections · refreshes every 5 seconds</p>
        </div>
      </header>

      <section className="stat-grid alert-stat-grid">
        <div className="stat-card">
          <p>Open alerts</p>
          <strong>{counts.open}</strong>
        </div>
        <div className="stat-card">
          <p>Critical</p>
          <strong className="danger-text">{counts.critical}</strong>
        </div>
        <div className="stat-card">
          <p>Warnings</p>
          <strong>{counts.warning}</strong>
        </div>
        <div className="stat-card">
          <p>Total listed</p>
          <strong>{alerts.length}</strong>
        </div>
      </section>

      <div className="alert-filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'critical', label: 'Critical' },
          { key: 'warning', label: 'Warning' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`alert-filter-btn${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="fleet-loading">Loading alerts…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {ackError && <p className="form-error" role="alert">{ackError}</p>}

      {!loading && !error && (
        <section className="fleet-panel">
          <AlertList
            alerts={sorted}
            vehicles={vehicles}
            onAcknowledge={acknowledge}
            acknowledgingId={acknowledgingId}
            emptyMessage="No alerts match this filter."
          />
        </section>
      )}
    </div>
  );
}
