import { Link } from 'react-router-dom';
import { formatTripTime, formatDuration, formatDistance } from '../utils/trips.js';
import RiskBadge from './RiskBadge.jsx';

export default function VehicleTable({ vehicles }) {
  if (!vehicles.length) {
    return <p className="fleet-empty">No vehicles loaded.</p>;
  }

  const STATUS_CLASS = { active: 'status-active', idle: 'status-idle', offline: 'status-offline' };

  return (
    <div className="table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Plate</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Speed</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <td><strong>{v.label}</strong></td>
              <td>{v.plateNumber}</td>
              <td>{v.driverName || '—'}</td>
              <td><span className={`status-pill ${STATUS_CLASS[v.status] || ''}`}>{v.status}</span></td>
              <td>{v.lastSpeedKmh != null ? `${Math.round(v.lastSpeedKmh)} km/h` : '—'}</td>
              <td>{v.speedLimitKmh} km/h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TripTable({ trips }) {
  if (!trips.length) {
    return (
      <div className="fleet-empty-block">
        <p className="fleet-empty">No trips recorded yet.</p>
        <Link to="/simulator" className="fleet-link">Go to Simulator</Link>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Distance</th>
            <th>Status</th>
            <th>Risk</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => {
            const isActive = !t.endedAt || t.status === 'active';
            return (
              <tr key={t.id}>
                <td><strong>{t.plateNumber}</strong></td>
                <td>{t.driverName || '—'}</td>
                <td>{formatTripTime(t.startedAt)}</td>
                <td>{isActive ? '—' : formatTripTime(t.endedAt)}</td>
                <td>{isActive ? '—' : formatDuration(t.durationSeconds)}</td>
                <td>{formatDistance(t.distanceM)}</td>
                <td>
                  {isActive
                    ? <span className="status-pill status-active">Active</span>
                    : <span className="status-pill status-idle">Completed</span>}
                </td>
                <td>
                  {isActive
                    ? <span className="fleet-muted">—</span>
                    : <RiskBadge label={t.riskLabel} size="sm" />}
                </td>
                <td><Link to={`/trips/${t.id}`} className="fleet-link">View</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
