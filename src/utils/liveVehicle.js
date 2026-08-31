/** Normalize live vehicle API responses to a consistent frontend shape */

export function normalizeLiveVehicle(raw) {
  return {
    vehicleId: raw.vehicleId ?? raw.id,
    plateNumber: raw.plateNumber ?? '—',
    label: raw.label ?? raw.plateNumber ?? 'Vehicle',
    latitude: raw.latitude ?? raw.lastLat ?? null,
    longitude: raw.longitude ?? raw.lastLng ?? null,
    speedKmh: raw.speedKmh ?? raw.lastSpeedKmh ?? 0,
    status: raw.status ?? (raw.tripId ? 'active' : 'idle'),
    updatedAt: raw.updatedAt ?? null,
    tripId: raw.tripId ?? raw.activeTripId ?? null,
  };
}

export function hasPosition(vehicle) {
  return vehicle.latitude != null && vehicle.longitude != null;
}

export function formatLastUpdated(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Africa/Accra',
  });
}

/** Kumasi — Ashanti Region, Ghana */
export const MAP_CENTER = [6.6885, -1.6244];
export const MAP_DEFAULT_ZOOM = 11;

/** Soft pan limit: whole of Ghana (SW → NE) */
export const GHANA_BOUNDS = [
  [4.5, -3.35],
  [11.25, 1.25],
];

export const LIVE_POLL_INTERVAL_MS = 5000;
