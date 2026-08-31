import { pool } from '../db/pool.js';
import { extractTripFeatures } from './tripFeatures.js';
import { calculateRisk } from './riskModel.js';

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function mapReading(row) {
  return {
    latitude: row.latitude,
    longitude: row.longitude,
    speedKmh: row.speed_kmh,
    distanceM: row.distance_m,
    recordedAt: row.recorded_at,
  };
}

function mapAlert(row, plateNumber) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    tripId: row.trip_id,
    plateNumber: plateNumber || row.plate_number,
    type: row.type,
    severity: row.severity,
    message: row.message,
    latitude: row.latitude,
    longitude: row.longitude,
    acknowledged: row.acknowledged,
    createdAt: row.created_at,
  };
}

function mapTripResponse(trip, readings, alerts, plateNumber, driverName, risk) {
  const features = extractTripFeatures({
    readings,
    alerts,
    speedLimitKmh: trip.speed_limit_kmh,
    startedAt: trip.started_at,
    endedAt: trip.ended_at,
  });

  return {
    id: trip.id,
    vehicleId: trip.vehicle_id,
    plateNumber,
    driverName,
    startedAt: trip.started_at,
    endedAt: trip.ended_at,
    status: trip.status,
    speedLimitKmh: trip.speed_limit_kmh,
    readingCount: features.readingCount,
    alertCount: features.totalAlertCount,
    distanceM: features.distanceTravelledM,
    durationSeconds: features.tripDurationSeconds,
    averageSpeedKmh: features.averageSpeedKmh,
    maximumSpeedKmh: features.maximumSpeedKmh,
    riskScore: risk.riskScore,
    riskLabel: risk.riskLabel,
    riskFactors: risk.riskFactors,
    features,
    readings: readings.map(mapReading),
    alerts: alerts.map((a) => mapAlert(a, plateNumber)),
  };
}

async function loadTripContext(client, tripId) {
  const tripRes = await client.query(
    `SELECT
       t.id,
       t.vehicle_id,
       t.driver_id,
       t.started_at,
       t.ended_at,
       t.status,
       t.speed_limit_kmh,
       t.risk_score,
       t.risk_label,
       t.risk_factors,
       v.plate_number,
       d.name AS driver_name
     FROM trips t
     JOIN vehicles v ON v.id = t.vehicle_id
     LEFT JOIN drivers d ON d.id = t.driver_id
     WHERE t.id = $1`,
    [tripId],
  );

  if (tripRes.rowCount === 0) return null;

  const trip = tripRes.rows[0];

  const readingsRes = await client.query(
    `SELECT latitude, longitude, speed_kmh, distance_m, recorded_at
     FROM gps_readings
     WHERE trip_id = $1
     ORDER BY recorded_at ASC`,
    [tripId],
  );

  const alertsRes = await client.query(
    `SELECT id, vehicle_id, trip_id, type, severity, message,
            latitude, longitude, acknowledged, created_at
     FROM alerts
     WHERE trip_id = $1
     ORDER BY created_at ASC`,
    [tripId],
  );

  return {
    trip,
    readings: readingsRes.rows,
    alerts: alertsRes.rows,
    plateNumber: trip.plate_number,
    driverName: trip.driver_name,
  };
}

/**
 * End an active trip: compute features, risk score, persist, return result.
 * Safe to call on already-completed trips (returns existing risk data).
 */
export async function endTrip(tripId, endedAt = new Date()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lockRes = await client.query(
      `SELECT id, status FROM trips WHERE id = $1 FOR UPDATE`,
      [tripId],
    );
    if (lockRes.rowCount === 0) {
      throw httpError(404, 'Trip not found', 'TRIP_NOT_FOUND');
    }

    const ctx = await loadTripContext(client, tripId);
    const { trip, readings, alerts, plateNumber, driverName } = ctx;

    if (trip.status === 'completed' && trip.ended_at) {
      const storedFactors = Array.isArray(trip.risk_factors) ? trip.risk_factors : [];
      const risk = {
        riskScore: trip.risk_score,
        riskLabel: trip.risk_label,
        riskFactors: storedFactors,
      };
      await client.query('COMMIT');
      return {
        ...mapTripResponse(trip, readings, alerts, plateNumber, driverName, risk),
        alreadyCompleted: true,
      };
    }

    const endIso = endedAt instanceof Date ? endedAt.toISOString() : new Date(endedAt).toISOString();

    const features = extractTripFeatures({
      readings,
      alerts,
      speedLimitKmh: trip.speed_limit_kmh,
      startedAt: trip.started_at,
      endedAt: endIso,
    });

    const risk = calculateRisk(features);

    const updateRes = await client.query(
      `UPDATE trips
       SET ended_at = $2,
           status = 'completed',
           risk_score = $3,
           risk_label = $4,
           risk_factors = $5::jsonb
       WHERE id = $1
       RETURNING
         id,
         vehicle_id,
         driver_id,
         started_at,
         ended_at,
         status,
         speed_limit_kmh,
         risk_score,
         risk_label,
         risk_factors`,
      [tripId, endIso, risk.riskScore, risk.riskLabel, JSON.stringify(risk.riskFactors)],
    );

    const updatedTrip = updateRes.rows[0];

    const otherActive = await client.query(
      `SELECT id FROM trips
       WHERE vehicle_id = $1 AND status = 'active' AND id <> $2
       LIMIT 1`,
      [updatedTrip.vehicle_id, tripId],
    );

    if (otherActive.rowCount === 0) {
      await client.query(
        `UPDATE vehicles SET status = 'idle' WHERE id = $1`,
        [updatedTrip.vehicle_id],
      );
    }

    await client.query('COMMIT');

    return {
      ...mapTripResponse(updatedTrip, readings, alerts, plateNumber, driverName, risk),
      alreadyCompleted: false,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export { loadTripContext, mapTripResponse, mapReading, mapAlert };
