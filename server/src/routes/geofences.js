import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        type,
        center_lat AS "centerLat",
        center_lng AS "centerLng",
        radius_m AS "radiusM"
      FROM geofences
      ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load geofences', code: 'SERVER_ERROR' });
  }
});

export default router;
