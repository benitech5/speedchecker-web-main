/**
 * Task 2 rule tests against a running API (http://localhost:3001).
 * Run: npm run db:reset && npm run dev  (other terminal)
 *      npm run test:rules
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE = 'http://localhost:3001/api';
const VEHICLE = '11111111-1111-1111-1111-111111111101';
const { Client } = pg;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  PASS: ${msg}`);
    passed += 1;
  } else {
    console.error(`  FAIL: ${msg}`);
    failed += 1;
  }
}

function north(lat, meters) {
  return lat + meters / 111320;
}

async function ingest(lat, lng, iso) {
  const res = await fetch(`${BASE}/gps/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleId: VEHICLE,
      latitude: lat,
      longitude: lng,
      timestamp: iso,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function getAlerts(qs = '') {
  const res = await fetch(`${BASE}/alerts${qs}`);
  return res.json();
}

async function clearVehicleData() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM rule_states WHERE vehicle_id = $1', [VEHICLE]);
  await client.query('DELETE FROM alerts WHERE vehicle_id = $1', [VEHICLE]);
  await client.query('DELETE FROM gps_readings WHERE vehicle_id = $1', [VEHICLE]);
  await client.query('DELETE FROM trips WHERE vehicle_id = $1', [VEHICLE]);
  await client.query(`UPDATE vehicles SET status = 'offline' WHERE id = $1`, [VEHICLE]);
  await client.end();
}

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  if (health.status !== 'ok') throw new Error('API not healthy');

  // --- Geofences ---
  console.log('\nTEST geofences API');
  const fences = await fetch(`${BASE}/geofences`).then((r) => r.json());
  assert(Array.isArray(fences) && fences.length >= 2, `geofences returned ${fences.length}`);
  assert(
    fences.some((f) => f.type === 'restricted'),
    'has restricted geofence',
  );

  // --- Normal driving ---
  console.log('\nTEST 1 — Normal driving (no overspeed)');
  await clearVehicleData();
  let t0 = Date.parse('2026-08-25T10:00:00.000Z'); // Tue 10:00 GMT (Africa/Accra)
  let lat = 6.6885;
  const lng = -1.6244;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 50); // ~18 km/h over 10s
  t0 += 10_000;
  const n1 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(n1.speedKmh < 80, `speed ${n1.speedKmh} below limit`);
  assert((n1.alerts || []).length === 0, 'no alerts on normal drive');

  // --- Overspeed warning ---
  console.log('\nTEST 2 — Overspeed warning (2 consecutive)');
  await clearVehicleData();
  t0 = Date.parse('2026-08-25T10:00:00.000Z');
  lat = 6.6885;
  await ingest(lat, lng, new Date(t0).toISOString());
  // ~90 km/h: 250 m / 10 s
  lat = north(lat, 250);
  t0 += 10_000;
  const o1 = await ingest(lat, lng, new Date(t0).toISOString());
  assert((o1.alerts || []).filter((a) => a.type === 'overspeed').length === 0, 'no alert after 1st overspeed');
  lat = north(lat, 250);
  t0 += 10_000;
  const o2 = await ingest(lat, lng, new Date(t0).toISOString());
  const warnAlerts = (o2.alerts || []).filter((a) => a.type === 'overspeed' && a.severity === 'warning');
  assert(warnAlerts.length === 1, `one warning after 2nd overspeed (got ${warnAlerts.length})`);
  lat = north(lat, 250);
  t0 += 10_000;
  const o3 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(
    (o3.alerts || []).filter((a) => a.type === 'overspeed' && a.severity === 'warning').length === 0,
    'no duplicate warning while still over',
  );
  // return below limit
  lat = north(lat, 40);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  // new event
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  const o4 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(
    (o4.alerts || []).filter((a) => a.type === 'overspeed' && a.severity === 'warning').length === 1,
    'new warning after reset + 2 overspeeds',
  );

  // --- Critical overspeed ---
  console.log('\nTEST 3 — Critical overspeed');
  await clearVehicleData();
  t0 = Date.parse('2026-08-25T10:00:00.000Z');
  lat = 6.6885;
  await ingest(lat, lng, new Date(t0).toISOString());
  // ~108 km/h: 300 m / 10 s (> 96)
  lat = north(lat, 300);
  t0 += 10_000;
  const c1 = await ingest(lat, lng, new Date(t0).toISOString());
  const crit = (c1.alerts || []).filter((a) => a.type === 'overspeed' && a.severity === 'critical');
  assert(crit.length === 1, `one critical alert (got ${crit.length}, speed=${c1.speedKmh})`);
  lat = north(lat, 300);
  t0 += 10_000;
  const c2 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(
    (c2.alerts || []).filter((a) => a.severity === 'critical').length === 0,
    'no duplicate critical',
  );

  // --- Restricted zone ---
  console.log('\nTEST 4 — Restricted zone');
  await clearVehicleData();
  t0 = Date.parse('2026-08-25T10:00:00.000Z');
  // Outside first (depot area)
  await ingest(6.6885, -1.6244, new Date(t0).toISOString());
  t0 += 10_000;
  // Enter restricted center 6.7020, -1.6050
  const r1 = await ingest(6.7020, -1.6050, new Date(t0).toISOString());
  const rz = (r1.alerts || []).filter((a) => a.type === 'restricted_zone');
  assert(rz.length === 1, `one restricted_zone alert (got ${rz.length})`);
  assert(rz[0]?.severity === 'critical', 'restricted is critical');
  t0 += 10_000;
  const r2 = await ingest(6.7021, -1.6051, new Date(t0).toISOString());
  assert(
    (r2.alerts || []).filter((a) => a.type === 'restricted_zone').length === 0,
    'no duplicate while inside',
  );
  t0 += 10_000;
  await ingest(6.6885, -1.6244, new Date(t0).toISOString()); // leave
  t0 += 10_000;
  const r3 = await ingest(6.7020, -1.6050, new Date(t0).toISOString());
  assert(
    (r3.alerts || []).filter((a) => a.type === 'restricted_zone').length === 1,
    'new alert on re-entry',
  );

  // --- Out of hours ---
  console.log('\nTEST 5 — Out of hours (GMT / Africa/Accra)');
  await clearVehicleData();
  // Saturday noon GMT = weekend in Ghana
  t0 = Date.parse('2026-08-22T12:00:00.000Z');
  lat = 6.6885;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 100);
  t0 += 10_000;
  const h1 = await ingest(lat, lng, new Date(t0).toISOString());
  const ooh = (h1.alerts || []).filter((a) => a.type === 'out_of_hours');
  assert(ooh.length === 1, `one out_of_hours alert (got ${ooh.length})`);
  lat = north(lat, 100);
  t0 += 10_000;
  const h2 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(
    (h2.alerts || []).filter((a) => a.type === 'out_of_hours').length === 0,
    'no duplicate OOH',
  );
  // Back to weekday hours (must be later than previous timestamps)
  t0 = Date.parse('2026-08-25T10:00:00.000Z');
  lat = north(lat, 50);
  await ingest(lat, lng, new Date(t0).toISOString());
  // Evening same day after 18:00 GMT
  t0 = Date.parse('2026-08-25T19:00:00.000Z');
  lat = north(lat, 100);
  const h3 = await ingest(lat, lng, new Date(t0).toISOString());
  assert(
    (h3.alerts || []).filter((a) => a.type === 'out_of_hours').length === 1,
    'new OOH after returning to hours then leaving again',
  );

  // --- Route deviation ---
  console.log('\nTEST 6 — Route deviation');
  await clearVehicleData();
  t0 = Date.parse('2026-08-25T10:00:00.000Z');
  // On route start
  await ingest(6.6885, -1.6244, new Date(t0).toISOString());
  t0 += 10_000;
  const d0 = await ingest(6.6910, -1.6200, new Date(t0).toISOString());
  assert(
    (d0.alerts || []).filter((a) => a.type === 'route_deviation').length === 0,
    'no deviation on route',
  );
  t0 += 10_000;
  // Far south of Kumasi corridor (~2 km+)
  const d1 = await ingest(6.6700, -1.6244, new Date(t0).toISOString());
  const dev = (d1.alerts || []).filter((a) => a.type === 'route_deviation');
  assert(dev.length === 1, `one route_deviation (got ${dev.length})`);
  t0 += 10_000;
  const d2 = await ingest(6.6695, -1.6250, new Date(t0).toISOString());
  assert(
    (d2.alerts || []).filter((a) => a.type === 'route_deviation').length === 0,
    'no duplicate deviation',
  );
  t0 += 10_000;
  await ingest(6.6910, -1.6200, new Date(t0).toISOString()); // back on route
  t0 += 10_000;
  const d3 = await ingest(6.6700, -1.6244, new Date(t0).toISOString());
  assert(
    (d3.alerts || []).filter((a) => a.type === 'route_deviation').length === 1,
    'new deviation after return',
  );

  // --- Acknowledge ---
  console.log('\nTEST 7 — Acknowledge');
  const all = await getAlerts(`?vehicleId=${VEHICLE}`);
  assert(all.length > 0, 'alerts list non-empty');
  const id = all[0].id;
  const ackRes = await fetch(`${BASE}/alerts/${id}/acknowledge`, { method: 'PATCH' });
  const ackBody = await ackRes.json();
  assert(ackRes.ok && ackBody.acknowledged === true, 'acknowledge sets true');
  const filtered = await getAlerts(`?acknowledged=false&vehicleId=${VEHICLE}`);
  assert(!filtered.some((a) => a.id === id), 'acknowledged alert filtered out');

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
