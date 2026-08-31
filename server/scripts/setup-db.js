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
    console.error('DATABASE_URL is missing. Copy .env.example to .env');
    process.exit(1);
  }

  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, '') || 'fleet_monitor';
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database exists: ${dbName}`);
    }
  } catch (err) {
    console.warn('Could not auto-create database (may need manual create):', err.message);
  } finally {
    await admin.end().catch(() => {});
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await client.query(schema);
  await client.end();
  console.log('Schema applied successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
