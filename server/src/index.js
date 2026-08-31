import { fileURLToPath } from 'url';
import { app, pool } from './app.js';

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
const PORT = Number(process.env.PORT) || 3001;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.error('Set DATABASE_URL and run: npm run db:reset');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Fleet API listening on http://localhost:${PORT}`);
    console.log(
      'Endpoints: /api/health /api/vehicles /api/vehicles/live /api/gps/ingest /api/alerts /api/geofences /api/trips /api/summary/weekly',
    );
  });
}

// Start only when run directly (keeps module import-safe for serverless platforms)
if (isMain) {
  start();
}
