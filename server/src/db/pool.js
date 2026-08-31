import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy server/.env.example to server/.env');
}

const connectionString = process.env.DATABASE_URL || '';

// Enable SSL when DATABASE_SSL=true or the connection string requests it (common on hosted Postgres).
const sslFlag = String(process.env.DATABASE_SSL || '').toLowerCase();
const sslFromUrl = /(?:^|[?&])sslmode=(require|verify-full|verify-ca)/i.test(connectionString);
const useSsl = sslFlag === 'true' || (sslFlag !== 'false' && sslFromUrl);

const poolConfig = {
  connectionString,
  // Serverless: keep the pool small to avoid exhausting provider connection limits.
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: process.env.VERCEL ? 10_000 : 30_000,
  connectionTimeoutMillis: 10_000,
};

if (useSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Reuse pool across serverless invocations to avoid exhausting connections.
const globalKey = '__speedchecker_pg_pool';
if (!globalThis[globalKey]) {
  globalThis[globalKey] = new Pool(poolConfig);
}

export const pool = globalThis[globalKey];

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});
