import { Router } from 'express';
import { getWeeklySummary } from '../services/weeklySummary.js';

const router = Router();

router.get('/weekly', async (req, res) => {
  try {
    const { week } = req.query;
    const summary = await getWeeklySummary(week || null);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load weekly summary', code: 'SERVER_ERROR' });
  }
});

export default router;
