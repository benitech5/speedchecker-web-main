import { pool } from '../db/pool.js';
import {
  haversineDistanceMeters,
  sanitizeSpeedKmh,
  speedKmhFromDistance,
} from '../utils/haversine.js';
import { evaluateRules } from './ruleEngine.js';

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function isValidLat(n) {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isValidLng(n) {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

/**
 * First reading of a trip: speed_kmh = 0, distance_m = 0 (no previous point).
 * After store, evaluates fleet rules and returns any newly created alerts.
 */
export async function ingestGps(body) {
  if (!body || typeof body !== 'object') {
    throw httpError(400, 'Request body is required', 'VALIDATION_ERROR');
  }

  const { vehicleId, latitude, longitude, timestamp } = body;

  if (!vehicleId || typeof vehicleId !== 'string') {
    throw httpError(400, 'vehicleId is required', 'VALIDATION_ERROR');
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!isValidLat(lat)) {
    throw httpError(400, 'latitude must be a number between -90 and 90', 'VALIDATION_ERROR');
  }
  if (!isValidLng(lng)) {
    throw httpError(400, 'longitude must be a number between -180 and 180', 'VALIDATION_ERROR');
  }

  if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
    throw httpError(400, 'timestamp must be a valid ISO 8601 datetime', 'VALIDATION_ERROR');
  }
  const recordedAt = new Date(timestamp);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vehicleRes = await client.query(
      `SELECT id, driver_id, speed_limit_kmh, status, plate_number
       FROM vehicles WHERE id = $1 FOR UPDATE`,
      [vehicleId],
    );
    if (vehicleRes.rowCount === 0) {
      throw httpError(404, 'Vehicle not found', 'VEHICLE_NOT_FOUND');
    }
    const vehicle = vehicleRes.rows[0];

    let tripRes = await client.query(
      `SELECT id FROM trips
       WHERE vehicle_id = $1 AND status = 'active' AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1
       FOR UPDATE`,
      [vehicleId],
    );

    let tripId;
    if (tripRes.rowCount === 0) {
      const created = await client.query(
        `INSERT INTO trips (vehicle_id, driver_id, started_at, status, speed_limit_kmh)
         VALUES ($1, $2, $3, 'active', $4)
         RETURNING id`,
        [vehicleId, vehicle.driver_id, recordedAt.toISOString(), vehicle.speed_limit_kmh],
      );
      tripId = created.rows[0].id;
    } else {
      tripId = tripRes.rows[0].id;
    }

    const prevRes = await client.query(
      `SELECT latitude, longitude, recorded_at
       FROM gps_readings
       WHERE trip_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [tripId],
    );

    let distanceM = 0;
    let speedKmh = 0;

    if (prevRes.rowCount > 0) {
      const prev = prevRes.rows[0];
      const elapsedMs = recordedAt.getTime() - new Date(prev.recorded_at).getTime();
      if (elapsedMs < 0) {
        throw httpError(400, 'timestamp must not be earlier than the previous reading', 'VALIDATION_ERROR');
      }
      distanceM = haversineDistanceMeters(prev.latitude, prev.longitude, lat, lng);
      const rawSpeed = speedKmhFromDistance(distanceM, elapsedMs);
      const sanitized = sanitizeSpeedKmh(rawSpeed);
      speedKmh = sanitized === null ? null : sanitized;
      distanceM = Number(distanceM.toFixed(2));
    }

    const insert = await client.query(
      `INSERT INTO gps_readings
        (vehicle_id, trip_id, latitude, longitude, speed_kmh, distance_m, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, speed_kmh, distance_m, recorded_at`,
      [vehicleId, tripId, lat, lng, speedKmh, distanceM, recordedAt.toISOString()],
    );

    await client.query(`UPDATE vehicles SET status = 'active' WHERE id = $1`, [vehicleId]);

    const reading = insert.rows[0];
    const newAlerts = await evaluateRules(client, {
      vehicleId,
      tripId,
      plateNumber: vehicle.plate_number,
      latitude: lat,
      longitude: lng,
      speedKmh: reading.speed_kmh,
      distanceM: reading.distance_m,
      speedLimitKmh: vehicle.speed_limit_kmh,
      recordedAt,
    });

    await client.query('COMMIT');

    return {
      tripId,
      vehicleId,
      readingId: reading.id,
      latitude: lat,
      longitude: lng,
      speedKmh: reading.speed_kmh,
      distanceM: reading.distance_m,
      timestamp: reading.recorded_at,
      alerts: newAlerts,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
