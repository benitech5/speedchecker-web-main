const EARTH_RADIUS_M = 6371000;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two WGS84 points (metres).
 */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Speed in km/h from distance (m) and elapsed milliseconds.
 * Returns 0 when elapsed is zero or invalid.
 */
export function speedKmhFromDistance(distanceM, elapsedMs) {
  if (!Number.isFinite(distanceM) || !Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }
  const hours = elapsedMs / 3_600_000;
  return distanceM / 1000 / hours;
}

/** Reject physically absurd speeds (GPS jump / bad clock). */
export function sanitizeSpeedKmh(speed) {
  if (!Number.isFinite(speed) || speed < 0) return 0;
  if (speed > 250) return null; // flag as unreliable — caller stores null
  return Number(speed.toFixed(2));
}
