import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { pool } from './db/pool.js';
import healthRouter from './routes/health.js';
import vehiclesRouter from './routes/vehicles.js';
import gpsRouter from './routes/gps.js';
import alertsRouter from './routes/alerts.js';
import geofencesRouter from './routes/geofences.js';
import tripsRouter from './routes/trips.js';
import summaryRouter from './routes/summary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/gps', gpsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/geofences', geofencesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/summary', summaryRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON', code: 'MALFORMED_JSON' });
  }
  res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
});

export { app, pool };
