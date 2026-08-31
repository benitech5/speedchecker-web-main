/**
 * Task 2 migration — safe to run on an existing Task 1 database.
 * Creates rule_states for alert deduplication.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const sql = `
CREATE TABLE IF NOT EXISTS rule_states (
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  rule_key VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vehicle_id, trip_id, rule_key)
);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_states_trip ON rule_states (trip_id);
`;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Task 2 migration applied (rule_states).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
