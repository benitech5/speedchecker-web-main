/**
 * Task 3 tests — trip end, risk scoring, trips API, weekly summary.
 * Requires API running: npm run dev (port 3001)
 * Run: npm run db:migrate:task3 && npm run test:task3
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

async function endTrip(tripId) {
  const res = await fetch(`${BASE}/trips/${tripId}/end`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
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

/** Normal-speed trip on 2026-08-25 (week containing test week param). */
async function runCleanTrip() {
  let t0 = Date.parse('2026-08-25T10:00:00.000Z');
  let lat = 6.6885;
  const lng = -1.6244;
  const p1 = await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 50);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 50);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  return p1.tripId;
}

async function runOverspeedTrip() {
  let t0 = Date.parse('2026-08-25T11:00:00.000Z');
  let lat = 6.6885;
  const lng = -1.6244;
  const p1 = await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  return p1.tripId;
}

async function runRestrictedTrip() {
  let t0 = Date.parse('2026-08-25T12:00:00.000Z');
  const p1 = await ingest(6.6885, -1.6244, new Date(t0).toISOString());
  t0 += 10_000;
  await ingest(6.7020, -1.6050, new Date(t0).toISOString());
  t0 += 10_000;
  await ingest(6.7021, -1.6051, new Date(t0).toISOString());
  return p1.tripId;
}

async function runMultiViolationTrip() {
  let t0 = Date.parse('2026-08-25T19:00:00.000Z'); // out-of-hours evening
  let lat = 6.6885;
  const lng = -1.6244;
  const p1 = await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  lat = north(lat, 250);
  t0 += 10_000;
  await ingest(lat, lng, new Date(t0).toISOString());
  t0 += 10_000;
  await ingest(6.7020, -1.6050, new Date(t0).toISOString());
  t0 += 10_000;
  await ingest(6.6700, -1.6244, new Date(t0).toISOString());
  return p1.tripId;
}

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  if (health.status !== 'ok') throw new Error('API not healthy — start npm run dev');

  await clearVehicleData();

  // TEST 1 — Clean trip → low risk
  console.log('\nTEST 1 — Clean trip (low risk)');
  const cleanTripId = await runCleanTrip();
  const cleanEnd = await endTrip(cleanTripId);
  assert(cleanEnd.status === 'completed', 'trip completed');
  assert(cleanEnd.riskScore >= 0 && cleanEnd.riskScore <= 100, `score in range (${cleanEnd.riskScore})`);
  assert(cleanEnd.riskLabel === 'low', `low risk (got ${cleanEnd.riskLabel}, score=${cleanEnd.riskScore})`);
  assert(Array.isArray(cleanEnd.riskFactors), 'riskFactors array present');

  // TEST 5 — End trip idempotency
  console.log('\nTEST 5 — End trip idempotency');
  const again = await endTrip(cleanTripId);
  assert(again.alreadyCompleted === true, 'alreadyCompleted flag');
  assert(again.riskScore === cleanEnd.riskScore, 'same risk score on re-end');

  // TEST 2 — Overspeed → higher risk than clean
  console.log('\nTEST 2 — Overspeed trip (risk increases)');
  const overTripId = await runOverspeedTrip();
  const overEnd = await endTrip(overTripId);
  assert(overEnd.riskScore > cleanEnd.riskScore, `overspeed score ${overEnd.riskScore} > clean ${cleanEnd.riskScore}`);
  assert(
    overEnd.riskFactors.some((f) => f.toLowerCase().includes('overspeed')),
    'overspeed in risk factors',
  );

  // TEST 3 — Restricted zone
  console.log('\nTEST 3 — Restricted zone trip');
  const rzTripId = await runRestrictedTrip();
  const rzEnd = await endTrip(rzTripId);
  assert(rzEnd.riskScore > cleanEnd.riskScore, `restricted score ${rzEnd.riskScore} > clean`);
  assert(
    rzEnd.riskFactors.some((f) => f.toLowerCase().includes('restricted')),
    'restricted-zone in risk factors',
  );
  const rzAlerts = rzEnd.alerts.filter((a) => a.type === 'restricted_zone');
  assert(rzAlerts.length >= 1, 'restricted_zone alert on trip');
  assert(rzAlerts.some((a) => a.severity === 'critical'), 'restricted alert is critical');

  // TEST 4 — Multiple violations → high risk
  console.log('\nTEST 4 — Multiple violations (high risk)');
  const multiTripId = await runMultiViolationTrip();
  const multiEnd = await endTrip(multiTripId);
  assert(multiEnd.riskLabel === 'high', `high risk (got ${multiEnd.riskLabel}, score=${multiEnd.riskScore})`);
  assert(multiEnd.riskScore >= 67, `score >= 67 (${multiEnd.riskScore})`);
  assert(multiEnd.riskScore > overEnd.riskScore, 'multi-violation > overspeed-only');

  // TEST 6 — Trip detail
  console.log('\nTEST 6 — Trip detail API');
  const detail = await fetch(`${BASE}/trips/${multiTripId}`).then((r) => r.json());
  assert(detail.id === multiTripId, 'trip id');
  assert(Array.isArray(detail.readings) && detail.readings.length > 0, 'readings present');
  assert(Array.isArray(detail.alerts), 'alerts present');
  assert(detail.riskScore != null, 'risk score on detail');
  assert(Array.isArray(detail.riskFactors), 'risk factors on detail');
  assert(detail.distanceM > 0, `distance calculated (${detail.distanceM}m)`);
  assert(detail.durationSeconds != null, 'duration present');

  // TEST 7 — Trip list
  console.log('\nTEST 7 — Trip list API');
  const list = await fetch(`${BASE}/trips`).then((r) => r.json());
  assert(Array.isArray(list) && list.length >= 4, `trips list (${list.length})`);
  const found = list.find((t) => t.id === cleanTripId);
  assert(found && found.riskLabel === 'low', 'list includes completed trip with risk');

  // TEST 8 — Weekly summary
  console.log('\nTEST 8 — Weekly summary API');
  const summary = await fetch(`${BASE}/summary/weekly?week=2026-08-25`).then((r) => r.json());
  assert(summary.totalTrips >= 4, `totalTrips ${summary.totalTrips}`);
  assert(summary.completedTrips >= 4, `completedTrips ${summary.completedTrips}`);
  assert(summary.totalAlerts > 0, `totalAlerts ${summary.totalAlerts}`);
  assert(typeof summary.alertsByType === 'object', 'alertsByType object');
  assert(Array.isArray(summary.topRiskyVehicles), 'topRiskyVehicles array');
  assert(summary.topRiskyVehicles.length > 0, 'has risky vehicles');
  assert(summary.avgRiskScore != null, `avgRiskScore ${summary.avgRiskScore}`);
  assert(summary.highRiskTrips >= 1, `highRiskTrips ${summary.highRiskTrips}`);

  // TEST 9 — Risk validation
  console.log('\nTEST 9 — Risk validation (behaviour sensitivity)');
  assert(cleanEnd.riskScore < overEnd.riskScore, 'clean < overspeed');
  assert(overEnd.riskScore < multiEnd.riskScore, 'overspeed < multi-violation');

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
