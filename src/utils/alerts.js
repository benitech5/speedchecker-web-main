/** Central alert display helpers — frontend only displays backend alerts */

export const ALERT_TYPE_LABELS = {
  overspeed: 'Overspeed',
  critical_overspeed: 'Critical Overspeed',
  geofence: 'Restricted Zone',
  restricted_zone: 'Restricted Zone',
  out_of_hours: 'Out of Hours',
  route_deviation: 'Route Deviation',
};

export const ALERT_POLL_INTERVAL_MS = 5000;

export function normalizeAlert(raw) {
  return {
    id: raw.id,
    type: raw.type,
    severity: raw.severity || 'warning',
    message: raw.message || '',
    vehicleId: raw.vehicleId,
    tripId: raw.tripId ?? null,
    plateNumber: raw.plateNumber || null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    acknowledged: Boolean(raw.acknowledged),
    createdAt: raw.createdAt || raw.timestamp || null,
  };
}

export function alertTypeLabel(type) {
  return ALERT_TYPE_LABELS[type] || type || 'Alert';
}

export function formatAlertTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Accra',
  });
}

export function formatRelativeTime(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatAlertTime(iso);
}

export function openAlerts(alerts) {
  return alerts.filter((a) => !a.acknowledged);
}

export function countBySeverity(alerts) {
  const open = openAlerts(alerts);
  return {
    open: open.length,
    critical: open.filter((a) => a.severity === 'critical').length,
    warning: open.filter((a) => a.severity === 'warning' || a.severity === 'info').length,
  };
}

/** Count open alerts per vehicleId */
export function openAlertCountByVehicle(alerts) {
  const map = {};
  for (const a of openAlerts(alerts)) {
    if (!a.vehicleId) continue;
    map[a.vehicleId] = (map[a.vehicleId] || 0) + 1;
  }
  return map;
}

/** Latest open alert per vehicleId */
export function latestOpenAlertByVehicle(alerts) {
  const map = {};
  for (const a of openAlerts(alerts)) {
    if (!a.vehicleId) continue;
    const existing = map[a.vehicleId];
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
      map[a.vehicleId] = a;
    }
  }
  return map;
}

export function resolvePlate(alert, vehicles = []) {
  if (alert.plateNumber) return alert.plateNumber;
  const match = vehicles.find((v) => v.vehicleId === alert.vehicleId || v.id === alert.vehicleId);
  return match?.plateNumber || 'Unknown vehicle';
}
