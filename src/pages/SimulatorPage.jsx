import { Link } from 'react-router-dom';
import { ROUTE_MODES } from '../data/simulatorRoutes.js';
import { isMockMode } from '../api/client.js';
import { useGpsSimulator } from '../hooks/useGpsSimulator.js';

export default function SimulatorPage() {
  const {
    vehicles,
    vehiclesLoading,
    vehicleId,
    routeMode,
    simStatus,
    pointsSent,
    lastPoint,
    lastResponse,
    error,
    sending,
    autoRunning,
    endingTrip,
    activeTripId,
    selectedVehicle,
    routeLabel,
    routeDescription,
    routeComplete,
    handleVehicleChange,
    handleRouteModeChange,
    sendOnePoint,
    startSimulation,
    stopSimulation,
    endTrip,
    formatPoint,
  } = useGpsSimulator();

  const controlsDisabled = sending || autoRunning || vehiclesLoading || endingTrip;

  return (
    <div className="fleet-page">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">GPS FEED</p>
          <h1>Simulator</h1>
          <p className="fleet-muted">
            Sends preset coordinates to <code>POST /api/gps/ingest</code>
            {isMockMode && ' (mock mode — set VITE_USE_MOCK=false for real backend)'}
          </p>
        </div>
        <Link to="/trips" className="fleet-link">Trip History →</Link>
      </header>

      <section className="fleet-panel simulator-panel">
        <div className="simulator-form">
          <label>
            <span>Select vehicle</span>
            <select
              value={vehicleId}
              disabled={controlsDisabled}
              onChange={(e) => handleVehicleChange(e.target.value)}
            >
              {vehiclesLoading && <option>Loading…</option>}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Simulation mode</span>
            <select
              value={routeMode}
              disabled={controlsDisabled}
              onChange={(e) => handleRouteModeChange(e.target.value)}
            >
              {Object.entries(ROUTE_MODES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <p className="simulator-route-preview">
            {ROUTE_MODES[routeMode].points.length} preset points · {routeDescription || ROUTE_MODES[routeMode].description}
          </p>

          <div className="simulator-actions">
            <button
              type="button"
              className="primary-button"
              disabled={controlsDisabled || routeComplete}
              onClick={sendOnePoint}
            >
              Send one point
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={controlsDisabled}
              onClick={startSimulation}
            >
              Start simulation
            </button>
            <button
              type="button"
              className="end-button"
              disabled={!autoRunning}
              onClick={stopSimulation}
            >
              Stop simulation
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!activeTripId || autoRunning || endingTrip}
              onClick={endTrip}
            >
              {endingTrip ? 'Ending…' : 'End trip'}
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {activeTripId && (
            <p className="fleet-muted simulator-note">
              Active trip: <code>{activeTripId}</code> — end it to see the full route in Trip History.
            </p>
          )}
        </div>

        <div className="simulator-status">
          <p className="eyebrow">STATUS</p>
          <dl className="simulator-status-grid">
            <div>
              <dt>Vehicle</dt>
              <dd>{selectedVehicle?.plateNumber ?? '—'}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{routeLabel}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd><span className={`sim-status sim-status-${simStatus.toLowerCase()}`}>{simStatus}</span></dd>
            </div>
            <div>
              <dt>Points sent</dt>
              <dd>{pointsSent}</dd>
            </div>
            <div>
              <dt>Last point</dt>
              <dd>{formatPoint(lastPoint)}</dd>
            </div>
            <div>
              <dt>Last response</dt>
              <dd className="sim-response">{lastResponse}</dd>
            </div>
          </dl>

          {selectedVehicle && (
            <ul className="map-info-list">
              <li><strong>{selectedVehicle.label}</strong><small>ID: {selectedVehicle.id}</small></li>
              <li><strong>Driver</strong><small>{selectedVehicle.driverName || 'Unassigned'}</small></li>
              <li><strong>Speed limit</strong><small>{selectedVehicle.speedLimitKmh} km/h</small></li>
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
