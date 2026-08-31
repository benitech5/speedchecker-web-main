import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(
    'TRUNCATE gps_readings, alerts, rule_states, trips, vehicles, drivers, geofences, planned_routes CASCADE',
  );

  const seed = fs.readFileSync(path.join(__dirname, '../sql/seed.sql'), 'utf8');
  await client.query(seed);

  const vehicles = await client.query(
    'SELECT id, plate_number, label FROM vehicles ORDER BY plate_number',
  );
  console.log('Seed complete. Vehicle IDs for frontend:');
  for (const row of vehicles.rows) {
    console.log(`  ${row.plate_number} (${row.label}): ${row.id}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
