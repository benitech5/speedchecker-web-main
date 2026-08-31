import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import { LiveVehicleTable } from '../components/LiveVehicleTable.jsx';
import AlertList from '../components/AlertList.jsx';
import FleetMap from '../components/FleetMap.jsx';
import WeeklySummaryPanel from '../components/WeeklySummaryPanel.jsx';
import { useLiveFleet } from '../hooks/useLiveFleet.js';
import { useAlerts } from '../hooks/useAlerts.js';
import {
  countBySeverity,
  openAlertCountByVehicle,
  latestOpenAlertByVehicle,
} from '../utils/alerts.js';
import { normalizeWeeklySummary } from '../utils/risk.js';

export default function DashboardPage() {
  const {
    vehicles: liveVehicles,
    geofences,
    liveLoading,
    liveError,
  } = useLiveFleet();

  const {
    alerts,
    loading: alertsLoading,
    error: alertsError,
  } = useAlerts();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const loadSummary = useCallback(() => {
    setSummaryLoading(true);
    setSummaryError('');
    api.getWeeklySummary()
      .then((data) => setSummary(normalizeWeeklySummary(data)))
      .catch((e) => {
        setSummary(null);
        setSummaryError(e.message || 'Unable to load weekly summary.');
      })
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const counts = useMemo(() => countBySeverity(alerts), [alerts]);
  const alertCounts = useMemo(() => openAlertCountByVehicle(alerts), [alerts]);
  const latestByVehicle = useMemo(() => latestOpenAlertByVehicle(alerts), [alerts]);

  const recentAlerts = useMemo(
    () => [...alerts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5),
    [alerts],
  );

  const vehiclesWithAlerts = useMemo(
    () => liveVehicles.map((v) => ({
      ...v,
      openAlertCount: alertCounts[v.vehicleId] || 0,
      latestAlert: latestByVehicle[v.vehicleId] || null,
    })),
    [liveVehicles, alertCounts, latestByVehicle],
  );

  const activeCount = liveVehicles.filter((v) => v.status === 'active').length;

  return (
    <div className="fleet-page">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">FLEET OVERVIEW</p>
          <h1>Dashboard</h1>
        </div>
        <Link to="/simulator" className="primary-button fleet-header-btn">Open simulator</Link>
      </header>

      {/* —— Live operational monitoring —— */}
      <p className="section-label">Live Fleet Overview</p>

      {liveLoading && <p className="fleet-loading">Loading fleet…</p>}
      {liveError && <p className="form-error" role="alert">{liveError}</p>}
      {alertsError && <p className="fleet-warn" role="alert">{alertsError}</p>}

      {!liveLoading && !liveError && (
        <>
          <section className="stat-grid">
            <StatCard label="Total vehicles" value={liveVehicles.length} />
            <StatCard label="Active now" value={activeCount} hint="On road" />
            <StatCard label="Open alerts" value={counts.open} />
            <StatCard label="Critical open" value={counts.critical} hint={`${counts.warning} warnings`} />
          </section>

          <section className="fleet-panel">
            <div className="fleet-panel-head">
              <h2>Fleet status</h2>
              <Link to="/map" className="fleet-link">Full map</Link>
            </div>
            <LiveVehicleTable vehicles={vehiclesWithAlerts} showAlerts />
          </section>

          <section className="fleet-panel dashboard-map-preview">
            <div className="fleet-panel-head">
              <h2>Live map preview</h2>
              <span className="fleet-muted">Updates every 5 seconds</span>
            </div>
            <FleetMap
              vehicles={vehiclesWithAlerts}
              geofences={geofences}
              height="320px"
              className="dashboard-map"
            />
          </section>

          <section className="fleet-panel">
            <div className="fleet-panel-head">
              <h2>Recent alerts</h2>
              <Link to="/alerts" className="fleet-link">View all</Link>
            </div>
            {alertsLoading ? (
              <p className="fleet-loading">Loading alerts…</p>
            ) : (
              <AlertList
                alerts={recentAlerts}
                vehicles={liveVehicles}
                compact
                emptyMessage="No alerts. Fleet is operating normally."
              />
            )}
          </section>
        </>
      )}

      {/* —— Historical management insight —— */}
      <p className="section-label">Historical Management Insight</p>

      <WeeklySummaryPanel
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        onRefresh={loadSummary}
      />
    </div>
  );
}
