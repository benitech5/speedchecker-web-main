import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import AlertList from '../components/AlertList.jsx';
import FleetMap from '../components/FleetMap.jsx';
import TripRiskPanel from '../components/TripRiskPanel.jsx';
import {
  formatTripTime,
  formatDuration,
  formatDistance,
  normalizeTripDetail,
  readingsToLatLngs,
} from '../utils/trips.js';

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setTrip(null);
    api.getTrip(id)
      .then((data) => setTrip(normalizeTripDetail(data)))
      .catch((e) => {
        const msg = e.message || 'Unable to load trip details.';
        setError(msg.includes('not found') || msg.includes('404') ? 'Trip not found.' : msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const routePoints = useMemo(
    () => (trip ? readingsToLatLngs(trip.readings) : []),
    [trip],
  );

  if (loading) {
    return (
      <div className="fleet-page">
        <p className="fleet-loading">Loading trip…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fleet-page">
        <p className="form-error" role="alert">{error}</p>
        <Link to="/trips" className="fleet-link">← Back to Trip History</Link>
      </div>
    );
  }

  if (!trip) return null;

  const isActive = !trip.endedAt || trip.status === 'active';

  return (
    <div className="fleet-page">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">TRIP DETAILS</p>
          <h1>{trip.plateNumber}</h1>
          <p className="fleet-muted">
            {trip.driverName || 'No driver'} · {isActive ? 'Active' : 'Completed'}
          </p>
        </div>
        <Link to="/trips" className="fleet-link">← Back to Trip History</Link>
      </header>

      <div className="trip-detail-meta">
        <div>
          <p>Vehicle</p>
          <strong>{trip.plateNumber}</strong>
        </div>
        <div>
          <p>Driver</p>
          <strong>{trip.driverName || '—'}</strong>
        </div>
        <div>
          <p>Status</p>
          <strong>
            {isActive
              ? <span className="status-pill status-active">Active</span>
              : <span className="status-pill status-idle">Completed</span>}
          </strong>
        </div>
        <div>
          <p>Start</p>
          <strong>{formatTripTime(trip.startedAt)}</strong>
        </div>
        <div>
          <p>End</p>
          <strong>{isActive ? '—' : formatTripTime(trip.endedAt)}</strong>
        </div>
        <div>
          <p>Duration</p>
          <strong>{isActive ? '—' : formatDuration(trip.durationSeconds)}</strong>
        </div>
        <div>
          <p>Distance</p>
          <strong>{formatDistance(trip.distanceM)}</strong>
        </div>
        <div>
          <p>GPS readings</p>
          <strong>{trip.readings.length}</strong>
        </div>
        <div>
          <p>Alerts</p>
          <strong>{trip.alerts.length}</strong>
        </div>
        {trip.speedLimitKmh != null && (
          <div>
            <p>Speed limit</p>
            <strong>{trip.speedLimitKmh} km/h</strong>
          </div>
        )}
      </div>

      <TripRiskPanel trip={trip} />

      <section className="fleet-panel">
        <div className="fleet-panel-head">
          <h2>Trip route</h2>
        </div>
        {routePoints.length < 2 ? (
          <p className="fleet-empty">No GPS route is available for this trip.</p>
        ) : (
          <FleetMap
            vehicles={[]}
            geofences={[]}
            showGeofences={false}
            routePoints={routePoints}
            routeAlerts={trip.alerts}
            showStartEnd
            startTime={trip.readings[0]?.recordedAt || trip.startedAt}
            endTime={trip.readings.at(-1)?.recordedAt || trip.endedAt}
            fitKey={trip.id}
            height="440px"
          />
        )}
      </section>

      <div className="fleet-two-col">
        <section className="fleet-panel">
          <h2>GPS readings</h2>
          {trip.readings.length === 0 ? (
            <p className="fleet-empty">No GPS readings for this trip.</p>
          ) : (
            <div className="table-wrap">
              <table className="fleet-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.readings.map((r, i) => (
                    <tr key={`${r.recordedAt}-${i}`}>
                      <td>
                        {r.recordedAt
                          ? new Date(r.recordedAt).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td>{r.latitude?.toFixed(5) ?? '—'}</td>
                      <td>{r.longitude?.toFixed(5) ?? '—'}</td>
                      <td>{r.speedKmh != null ? `${Number(r.speedKmh).toFixed(1)} km/h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="fleet-panel">
          <h2>Trip alerts</h2>
          <AlertList
            alerts={trip.alerts}
            emptyMessage="No alerts for this trip."
          />
        </section>
      </div>
    </div>
  );
}
