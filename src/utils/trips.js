import { normalizeAlert } from './alerts.js';
import { normalizeRiskFactors, normalizeRiskLabel } from './risk.js';

export function formatTripTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
  const s = Math.round(Number(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

export function formatDistance(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return '—';
  const m = Number(meters);
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

export function normalizeTripSummary(raw) {
  const startedAt = raw.startedAt || raw.startTime || null;
  const endedAt = raw.endedAt || raw.endTime || null;
  return {
    id: raw.id,
    vehicleId: raw.vehicleId,
    plateNumber: raw.plateNumber || raw.vehicle?.plateNumber || '—',
    driverName: raw.driverName || raw.driver?.name || raw.driver || null,
    startedAt,
    endedAt,
    status: raw.status || (endedAt ? 'completed' : 'active'),
    readingCount: raw.readingCount ?? raw.readings?.length ?? null,
    alertCount: raw.alertCount ?? raw.alerts?.length ?? null,
    distanceM: raw.distanceM ?? null,
    durationSeconds: raw.durationSeconds ?? null,
    riskScore: raw.riskScore ?? null,
    riskLabel: normalizeRiskLabel(raw.riskLabel || raw.riskLevel),
  };
}

export function normalizeReading(raw) {
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    speedKmh: raw.speedKmh ?? raw.speed ?? null,
    distanceM: raw.distanceM ?? raw.distance ?? null,
    recordedAt: raw.recordedAt || raw.timestamp || null,
  };
}

export function normalizeTripDetail(raw) {
  const summary = normalizeTripSummary(raw);
  const readings = Array.isArray(raw.readings)
    ? raw.readings.map(normalizeReading).sort((a, b) => {
        if (!a.recordedAt || !b.recordedAt) return 0;
        return new Date(a.recordedAt) - new Date(b.recordedAt);
      })
    : [];

  const alerts = Array.isArray(raw.alerts)
    ? raw.alerts.map(normalizeAlert)
    : [];

  return {
    ...summary,
    speedLimitKmh: raw.speedLimitKmh ?? null,
    distanceM: raw.distanceM ?? summary.distanceM ?? null,
    durationSeconds: raw.durationSeconds ?? summary.durationSeconds ?? null,
    riskFactors: normalizeRiskFactors(raw.riskFactors || raw.factors || raw.riskReasons),
    readings,
    alerts,
    route: raw.route || null,
  };
}

/** Leaflet [lat, lng] pairs from readings */
export function readingsToLatLngs(readings) {
  return readings
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => [r.latitude, r.longitude]);
}
