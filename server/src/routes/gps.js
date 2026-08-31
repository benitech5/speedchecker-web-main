import { Router } from 'express';
import { ingestGps } from '../services/gpsIngest.js';

const router = Router();

router.post('/ingest', async (req, res) => {
  try {
    const result = await ingestGps(req.body);
    res.status(201).json(result);
  } catch (err) {
    const status = err.status || 500;
    const code = err.code || 'SERVER_ERROR';
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Ingest failed', code });
  }
});

export default router;
