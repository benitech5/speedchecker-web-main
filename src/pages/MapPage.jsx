import { useMemo } from 'react';
import { useLiveFleet } from '../hooks/useLiveFleet.js';
import { useAlerts } from '../hooks/useAlerts.js';
import FleetMap from '../components/FleetMap.jsx';
import { LiveVehicleTable } from '../components/LiveVehicleTable.jsx';
import {
  openAlertCountByVehicle,
  latestOpenAlertByVehicle,
} from '../utils/alerts.js';

export default function MapPage() {
  const {
    vehicles,
    geofences,
    liveLoading,
    geofencesLoading,
    liveError,
    geofenceError,
  } = useLiveFleet();

  const { alerts, error: alertsError } = useAlerts();

  const vehiclesWithAlerts = useMemo(() => {
    const counts = openAlertCountByVehicle(alerts);
    const latest = latestOpenAlertByVehicle(alerts);
    return vehicles.map((v) => ({
      ...v,
      openAlertCount: counts[v.vehicleId] || 0,
      latestAlert: latest[v.vehicleId] || null,
    }));
  }, [vehicles, alerts]);

  return (
    <div className="fleet-page fleet-page-map">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">LIVE VIEW</p>
          <h1>Fleet map</h1>
          <p className="fleet-muted">Ashanti Region, Ghana · live positions · refreshes every 5 seconds</p>
        </div>
      </header>

      {(liveLoading || geofencesLoading) && (
        <p className="fleet-loading">Loading map data…</p>
      )}

      {liveError && <p className="form-error" role="alert">{liveError}</p>}
      {geofenceError && <p className="fleet-warn" role="alert">{geofenceError}</p>}
      {alertsError && <p className="fleet-warn" role="alert">{alertsError}</p>}

      {!liveLoading && (
        <FleetMap
          vehicles={vehiclesWithAlerts}
          geofences={geofenceError ? [] : geofences}
          height="520px"
        />
      )}

      {!geofencesLoading && !geofenceError && geofences.length === 0 && (
        <p className="fleet-muted map-geofence-note">No geofences configured.</p>
      )}

      <section className="fleet-panel map-vehicle-panel">
        <div className="fleet-panel-head">
          <h2>Live fleet</h2>
          <span className="fleet-muted">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</span>
        </div>
        {!liveLoading && !liveError && (
          <LiveVehicleTable vehicles={vehiclesWithAlerts} showAlerts />
        )}
        {!liveLoading && liveError && (
          <p className="fleet-empty">Unable to load live vehicle data.</p>
        )}
      </section>
    </div>
  );
}
