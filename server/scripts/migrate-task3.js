/**
 * Add risk_factors column to trips (Task 3).
 * Run: npm run db:migrate:task3
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb
  `);

  console.log('Task 3 migration complete: trips.risk_factors');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
