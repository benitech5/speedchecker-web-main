# Fleet Monitor Backend

Node.js + Express + PostgreSQL API for GPS ingest, Haversine speed, fleet rules, trip intelligence, and risk scoring.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local install, Docker, Supabase, or Neon)

## Setup

```bash
cd server
cp .env.example .env
# Edit DATABASE_URL if needed
npm install
npm run db:reset
npm run dev
```

Default `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fleet_monitor
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

On some Windows installs PostgreSQL listens on **5433** instead of 5432.

If upgrading an existing database:

```bash
npm run db:migrate:task2
npm run db:migrate:task3
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Server + DB check |
| GET | `/api/vehicles` | Seeded vehicles |
| GET | `/api/vehicles/live` | Latest GPS per vehicle |
| POST | `/api/gps/ingest` | GPS + Haversine + rules |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/geofences` | Geofence circles |
| GET | `/api/trips` | Trip list |
| GET | `/api/trips/:id` | Trip detail |
| POST | `/api/trips/:id/end` | End trip + risk scoring |
| GET | `/api/summary/weekly` | Weekly fleet analytics |

## Tests

```bash
npm run test:rules    # Task 2 (API must be running)
npm run test:task3    # Task 3 trips + risk + summary
```

## Docs

- `docs/API_TASK1.md` — vehicles / ingest
- `docs/API_TASK2.md` — alerts / geofences / rules
- `docs/API_TASK3.md` — trips / risk / weekly summary
- `docs/DEV1_HANDOFF.md` — frontend integration notes
- `../docs/DEPLOYMENT.md` — production deployment guide

## Vercel deployment (backend)

Deploy as a **separate Vercel project** with **Root Directory** set to `server`.

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | (empty) |
| Entry point | `api/index.js` (Express app) |
| Routing | `server/vercel.json` rewrites all paths to `/api` |

**Environment variables:** `DATABASE_URL`, `DATABASE_SSL`, `CORS_ORIGIN`, `NODE_ENV`

**Database setup (one-time, from your machine):**

```bash
cd server
# Set DATABASE_URL in .env to your hosted PostgreSQL
npm run db:reset    # schema + seed
```

Do **not** run migrations from serverless functions. Verify after deploy:

```
GET https://YOUR-BACKEND-PROJECT.vercel.app/api/health
```

See `../docs/DEPLOYMENT.md` for the full two-project deployment guide.

## Not included

Authentication, push/email notifications, trained ML pipeline.
