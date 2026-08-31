import RiskBadge from './RiskBadge.jsx';
import StatCard from './StatCard.jsx';
import { alertTypeLabel } from '../utils/alerts.js';

export default function WeeklySummaryPanel({
  summary,
  loading,
  error,
  onRefresh,
}) {
  if (loading) {
    return (
      <section className="fleet-panel">
        <h2>Weekly Fleet Summary</h2>
        <p className="fleet-loading">Loading weekly summary…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fleet-panel">
        <div className="fleet-panel-head">
          <h2>Weekly Fleet Summary</h2>
          {onRefresh && (
            <button type="button" className="fleet-btn-sm" onClick={onRefresh}>Refresh</button>
          )}
        </div>
        <p className="form-error" role="alert">{error}</p>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="fleet-panel">
        <div className="fleet-panel-head">
          <h2>Weekly Fleet Summary</h2>
          {onRefresh && (
            <button type="button" className="fleet-btn-sm" onClick={onRefresh}>Refresh</button>
          )}
        </div>
        <p className="fleet-empty">No trip data for this week yet. Run the simulator and end trips to populate the summary.</p>
      </section>
    );
  }

  const typeEntries = Object.entries(summary.alertsByType || {});
  const top = summary.topRiskVehicle;
  const ranked = summary.topRiskyVehicles || [];
  const drivers = summary.topRiskyDrivers || [];
  const hasTripData = (summary.totalTrips ?? 0) > 0;

  return (
    <section className="fleet-panel weekly-summary-panel">
      <div className="fleet-panel-head">
        <div>
          <h2>Weekly Fleet Summary</h2>
          {(summary.weekStart || summary.weekEnd) && (
            <p className="fleet-muted" style={{ margin: '4px 0 0' }}>
              {summary.weekStart || '—'} — {summary.weekEnd || '—'}
            </p>
          )}
        </div>
        {onRefresh && (
          <button type="button" className="fleet-btn-sm" onClick={onRefresh}>Refresh</button>
        )}
      </div>

      <div className="stat-grid weekly-stat-grid">
        {summary.totalTrips != null && (
          <StatCard label="Total trips" value={summary.totalTrips} />
        )}
        {summary.completedTrips != null && (
          <StatCard label="Completed trips" value={summary.completedTrips} />
        )}
        {summary.totalAlerts != null && (
          <StatCard label="Total alerts" value={summary.totalAlerts} />
        )}
        {summary.criticalAlerts != null && (
          <StatCard label="Critical alerts" value={summary.criticalAlerts} />
        )}
        {summary.warningAlerts != null && (
          <StatCard label="Warning alerts" value={summary.warningAlerts} />
        )}
        {summary.activeVehicles != null && (
          <StatCard label="Active vehicles" value={summary.activeVehicles} />
        )}
        {summary.avgRiskScore != null && (
          <StatCard label="Avg risk score" value={summary.avgRiskScore} hint="/ 100" />
        )}
      </div>

      {hasTripData && (summary.lowRiskTrips != null || summary.highRiskTrips != null) && (
        <div className="stat-grid weekly-stat-grid">
          {summary.lowRiskTrips != null && (
            <StatCard label="Low risk trips" value={summary.lowRiskTrips} />
          )}
          {summary.mediumRiskTrips != null && (
            <StatCard label="Medium risk trips" value={summary.mediumRiskTrips} />
          )}
          {summary.highRiskTrips != null && (
            <StatCard label="High risk trips" value={summary.highRiskTrips} />
          )}
        </div>
      )}

      {!hasTripData && (
        <p className="fleet-muted" style={{ marginBottom: '1rem' }}>
          No trips recorded this week. Use the simulator to create demo trips.
        </p>
      )}

      <div className="weekly-summary-body">
        {top && (
          <div className="top-risk-card">
            <p className="eyebrow">TOP RISK VEHICLE</p>
            <strong className="top-risk-plate">{top.plateNumber}</strong>
            <div className="top-risk-meta">
              {top.riskLabel && <RiskBadge label={top.riskLabel} score={top.riskScore} />}
              {top.alertCount != null && (
                <span className="fleet-muted">{top.alertCount} alerts</span>
              )}
            </div>
          </div>
        )}

        {typeEntries.length > 0 && (
          <div className="alert-breakdown">
            <p className="eyebrow">ALERTS BY TYPE</p>
            <ul className="alert-breakdown-list">
              {typeEntries.map(([type, count]) => (
                <li key={type}>
                  <span>{alertTypeLabel(type)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ranked.length > 0 && (
          <div className="risk-rank-list">
            <p className="eyebrow">HIGHEST RISK VEHICLES</p>
            <ol>
              {ranked.map((v, i) => (
                <li key={`${v.plateNumber}-${i}`}>
                  <span className="rank-num">{i + 1}.</span>
                  <strong>{v.plateNumber}</strong>
                  {v.riskLabel && <RiskBadge label={v.riskLabel} size="sm" />}
                  {v.riskScore != null && <span className="fleet-muted">{v.riskScore}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}

        {drivers.length > 0 && (
          <div className="risk-rank-list">
            <p className="eyebrow">HIGHEST RISK DRIVERS</p>
            <ol>
              {drivers.map((d, i) => (
                <li key={`${d.name}-${i}`}>
                  <span className="rank-num">{i + 1}.</span>
                  <strong>{d.name}</strong>
                  {d.riskLabel && <RiskBadge label={d.riskLabel} size="sm" />}
                  {d.riskScore != null && <span className="fleet-muted">{d.riskScore}</span>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
