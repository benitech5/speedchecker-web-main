import { formatLastUpdated } from '../utils/liveVehicle.js';

const STATUS_CLASS = { active: 'status-active', idle: 'status-idle', offline: 'status-offline' };

export function LiveVehicleTable({
  vehicles,
  showAlerts = false,
  emptyMessage = 'No live vehicle data available.',
}) {
  if (!vehicles.length) {
    return <p className="fleet-empty">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Plate</th>
            <th>Status</th>
            <th>Speed</th>
            {showAlerts && <th>Alerts</th>}
            <th>Location</th>
            <th>Last updated</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const openCount = v.openAlertCount ?? 0;
            return (
              <tr key={v.vehicleId} className={openCount > 0 ? 'row-has-alert' : ''}>
                <td><strong>{v.label}</strong></td>
                <td>{v.plateNumber}</td>
                <td>
                  <span className={`status-pill ${STATUS_CLASS[v.status] || ''}`}>
                    {v.status}
                  </span>
                </td>
                <td>{v.speedKmh != null ? `${Math.round(v.speedKmh)} km/h` : '—'}</td>
                {showAlerts && (
                  <td>
                    {openCount > 0 ? (
                      <span className="alert-count-pill">{openCount} open</span>
                    ) : (
                      <span className="fleet-muted">0</span>
                    )}
                  </td>
                )}
                <td>
                  {v.latitude != null && v.longitude != null
                    ? `${v.latitude.toFixed(4)}, ${v.longitude.toFixed(4)}`
                    : '—'}
                </td>
                <td>{formatLastUpdated(v.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
