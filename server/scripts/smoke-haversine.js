/**
 * Offline smoke test for Haversine helpers (no DB required).
 * Run: node scripts/smoke-haversine.js
 */
import {
  haversineDistanceMeters,
  sanitizeSpeedKmh,
  speedKmhFromDistance,
} from '../src/utils/haversine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ~111 m north from 51.5074, -0.1278 (approx 0.001 deg lat)
const d = haversineDistanceMeters(51.5074, -0.1278, 51.5084, -0.1278);
assert(d > 100 && d < 120, `expected ~111m, got ${d}`);

const speed = speedKmhFromDistance(1000, 60_000); // 1 km in 1 min = 60 km/h
assert(Math.abs(speed - 60) < 0.01, `expected 60 km/h, got ${speed}`);

assert(speedKmhFromDistance(100, 0) === 0, 'zero elapsed → 0');
assert(sanitizeSpeedKmh(80) === 80, 'normal speed');
assert(sanitizeSpeedKmh(300) === null, 'GPS jump → null');

console.log('Haversine smoke tests passed.');
console.log(`Sample distance (0.001° lat): ${d.toFixed(2)} m`);
console.log(`Sample speed (1 km / 1 min): ${speed.toFixed(2)} km/h`);
