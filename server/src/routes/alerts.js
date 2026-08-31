import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { vehicleId, severity, type, acknowledged } = req.query;
    const clauses = [];
    const params = [];

    if (vehicleId) {
      params.push(vehicleId);
      clauses.push(`a.vehicle_id = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      clauses.push(`a.severity = $${params.length}`);
    }
    if (type) {
      params.push(type);
      clauses.push(`a.type = $${params.length}`);
    }
    if (acknowledged === 'true' || acknowledged === 'false') {
      params.push(acknowledged === 'true');
      clauses.push(`a.acknowledged = $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT
         a.id,
         a.vehicle_id AS "vehicleId",
         a.trip_id AS "tripId",
         v.plate_number AS "plateNumber",
         a.type,
         a.severity,
         a.message,
         a.latitude,
         a.longitude,
         a.acknowledged,
         a.created_at AS "createdAt"
       FROM alerts a
       JOIN vehicles v ON v.id = a.vehicle_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT 500`,
      params,
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load alerts', code: 'SERVER_ERROR' });
  }
});

router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, rowCount } = await pool.query(
      `UPDATE alerts SET acknowledged = TRUE
       WHERE id = $1
       RETURNING
         id,
         vehicle_id AS "vehicleId",
         trip_id AS "tripId",
         type,
         severity,
         message,
         latitude,
         longitude,
         acknowledged,
         created_at AS "createdAt"`,
      [id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found', code: 'ALERT_NOT_FOUND' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to acknowledge alert', code: 'SERVER_ERROR' });
  }
});

export default router;
