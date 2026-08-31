import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id,
        v.plate_number AS "plateNumber",
        v.label,
        v.speed_limit_kmh AS "speedLimitKmh",
        v.status,
        d.id AS "driverId",
        d.name AS "driverName"
      FROM vehicles v
      LEFT JOIN drivers d ON d.id = v.driver_id
      ORDER BY v.plate_number
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load vehicles', code: 'SERVER_ERROR' });
  }
});

router.get('/live', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        v.id AS "vehicleId",
        v.plate_number AS "plateNumber",
        v.label,
        v.status,
        v.speed_limit_kmh AS "speedLimitKmh",
        g.latitude,
        g.longitude,
        g.speed_kmh AS "speedKmh",
        g.recorded_at AS "updatedAt",
        g.trip_id AS "tripId"
      FROM vehicles v
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, speed_kmh, recorded_at, trip_id
        FROM gps_readings
        WHERE vehicle_id = v.id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) g ON TRUE
      ORDER BY v.plate_number
    `);

    const live = rows.map((r) => ({
      vehicleId: r.vehicleId,
      plateNumber: r.plateNumber,
      label: r.label,
      status: r.latitude == null ? 'offline' : r.status,
      speedLimitKmh: r.speedLimitKmh,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      speedKmh: r.speedKmh ?? null,
      updatedAt: r.updatedAt ?? null,
      tripId: r.tripId ?? null,
    }));

    res.json(live);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load live vehicles', code: 'SERVER_ERROR' });
  }
});

export default router;
