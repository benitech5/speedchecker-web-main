import { Router } from 'express';
import { pool } from '../db/pool.js';
import { endTrip, loadTripContext, mapTripResponse } from '../services/tripEnd.js';
import { calculateRisk } from '../services/riskModel.js';
import { extractTripFeatures } from '../services/tripFeatures.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { vehicleId, status, from, to } = req.query;
    const clauses = [];
    const params = [];

    if (vehicleId) {
      params.push(vehicleId);
      clauses.push(`t.vehicle_id = $${params.length}`);
    }
    if (status === 'active' || status === 'completed') {
      params.push(status);
      clauses.push(`t.status = $${params.length}`);
    }
    if (from) {
      params.push(from);
      clauses.push(`t.started_at >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      clauses.push(`t.started_at < $${params.length}::timestamptz`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.vehicle_id,
         t.started_at,
         t.ended_at,
         t.status,
         t.speed_limit_kmh,
         t.risk_score,
         t.risk_label,
         v.plate_number,
         d.name AS driver_name,
         (SELECT COUNT(*)::int FROM gps_readings g WHERE g.trip_id = t.id) AS reading_count,
         (SELECT COUNT(*)::int FROM alerts a WHERE a.trip_id = t.id) AS alert_count,
         (SELECT COALESCE(SUM(g.distance_m), 0) FROM gps_readings g WHERE g.trip_id = t.id) AS distance_m,
         CASE
           WHEN t.ended_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (t.ended_at - t.started_at))::int
           ELSE NULL
         END AS duration_seconds
       FROM trips t
       JOIN vehicles v ON v.id = t.vehicle_id
       LEFT JOIN drivers d ON d.id = t.driver_id
       ${where}
       ORDER BY t.started_at DESC
       LIMIT 200`,
      params,
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        vehicleId: r.vehicle_id,
        plateNumber: r.plate_number,
        driverName: r.driver_name,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        status: r.status,
        speedLimitKmh: r.speed_limit_kmh,
        readingCount: r.reading_count,
        alertCount: r.alert_count,
        distanceM: Number(r.distance_m) || 0,
        durationSeconds: r.duration_seconds,
        riskScore: r.risk_score,
        riskLabel: r.risk_label,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load trips', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ctx = await loadTripContext(pool, id);
    if (!ctx) {
      return res.status(404).json({ error: 'Trip not found', code: 'TRIP_NOT_FOUND' });
    }

    const { trip, readings, alerts, plateNumber, driverName } = ctx;

    let risk;
    if (trip.status === 'completed' && trip.risk_score != null) {
      risk = {
        riskScore: trip.risk_score,
        riskLabel: trip.risk_label,
        riskFactors: Array.isArray(trip.risk_factors) ? trip.risk_factors : [],
      };
    } else {
      const features = extractTripFeatures({
        readings,
        alerts,
        speedLimitKmh: trip.speed_limit_kmh,
        startedAt: trip.started_at,
        endedAt: trip.ended_at,
      });
      risk = calculateRisk(features);
    }

    const routeRes = await pool.query(
      `SELECT name, waypoints FROM planned_routes ORDER BY created_at LIMIT 1`,
    );
    const routeRow = routeRes.rows[0];

    const detail = mapTripResponse(trip, readings, alerts, plateNumber, driverName, risk);
    if (routeRow) {
      detail.route = {
        name: routeRow.name,
        waypoints: routeRow.waypoints,
      };
    }

    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load trip', code: 'SERVER_ERROR' });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await endTrip(id);
    const statusCode = result.alreadyCompleted ? 200 : 200;
    res.status(statusCode).json(result);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: err.code });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to end trip', code: 'SERVER_ERROR' });
  }
});

export default router;
