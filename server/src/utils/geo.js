import { haversineDistanceMeters } from './haversine.js';

const EARTH_RADIUS_M = 6371000;

/**
 * Approximate local ENU metres relative to a reference lat/lng.
 * Accurate enough for short fleet distances (< a few km).
 */
function toLocalMeters(lat, lng, refLat, refLng) {
  const cosLat = Math.cos((refLat * Math.PI) / 180);
  const x = (((lng - refLng) * Math.PI) / 180) * EARTH_RADIUS_M * cosLat;
  const y = (((lat - refLat) * Math.PI) / 180) * EARTH_RADIUS_M;
  return { x, y };
}

/**
 * Shortest distance (metres) from point P to line segment A→B.
 */
export function distancePointToSegmentMeters(plat, plng, aLat, aLng, bLat, bLng) {
  const refLat = (aLat + bLat + plat) / 3;
  const refLng = (aLng + bLng + plng) / 3;
  const p = toLocalMeters(plat, plng, refLat, refLng);
  const a = toLocalMeters(aLat, aLng, refLat, refLng);
  const b = toLocalMeters(bLat, bLng, refLat, refLng);

  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLenSq = abx * abx + aby * aby;

  let t = 0;
  if (abLenSq > 0) {
    t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  }
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  return Math.hypot(p.x - cx, p.y - cy);
}

/**
 * Minimum distance from a point to a polyline of {lat,lng} waypoints.
 */
export function distanceToRouteMeters(lat, lng, waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return null;
  if (waypoints.length === 1) {
    const w = waypoints[0];
    return haversineDistanceMeters(lat, lng, Number(w.lat), Number(w.lng));
  }

  let min = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const d = distancePointToSegmentMeters(
      lat,
      lng,
      Number(a.lat),
      Number(a.lng),
      Number(b.lat),
      Number(b.lng),
    );
    if (d < min) min = d;
  }
  return min;
}
