# SmartStart Fleet Monitor

A **web-based fleet monitoring system** for company vehicles in Kumasi, Ghana. Managers view live vehicle positions, safety alerts, trip history, and AI-assisted risk labels from a React dashboard. GPS input for demos comes from a built-in simulator that posts to the real backend API.

## Architecture

```
GPS Simulator (React)
      ↓
POST /api/gps/ingest
      ↓
Node.js / Express backend
      ↓
PostgreSQL
      ↓
Rule engine → Alerts
      ↓
Trip end → Feature extraction → Risk model
      ↓
React dashboard (live map, alerts, trips, weekly summary)
```

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite, React Router, Leaflet |
| Backend | Node.js, Express, PostgreSQL (`pg`) |
| Maps | OpenStreetMap via react-leaflet |
| Intelligence | Explainable weighted risk model (not trained ML) |

## Features

- **Dashboard** — live fleet status, open alerts, recent incidents, weekly analytics
- **Live map** — vehicle markers, geofence circles, 5-second polling
- **Alerts** — overspeed, critical overspeed, restricted zone, out-of-hours, route deviation
- **Trip history** — completed trips with distance, duration, risk score/label
- **Trip detail** — GPS route polyline, readings table, alerts, risk factors
- **GPS simulator** — five preset scenarios posting to `POST /api/gps/ingest`
- **Haversine speed** — backend calculates speed from consecutive GPS points
- **Risk scoring** — 0–100 score with low/medium/high labels on trip completion

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or hosted)

## Quick start (local)

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL (user, password, port)
npm install
npm run db:reset          # creates schema + seed data
npm run dev               # http://localhost:3001
```

### 2. Frontend

```bash
# from project root
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Ensure `.env` contains:

```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK=false
```

### 3. Demo flow

1. Open **Dashboard** — live fleet overview
2. **Developer Tools → Simulator**
3. Vehicle **AB12 CDE** → **Normal Route** → Start simulation → End trip
4. Open **Map** — see vehicle position update
5. Vehicle **XY34 FGH** → **Overspeed Route** → check **Alerts**
6. Vehicle **LM56 NPQ** → **Restricted-Area Route** → End trip → **Trips** → view risk

## Application routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard (default) |
| `/map` | Live fleet map |
| `/alerts` | Alert list + acknowledge |
| `/trips` | Trip history |
| `/trips/:id` | Trip detail (route, risk, alerts) |
| `/simulator` | GPS simulator (Developer Tools) |
| `/monitor` | Legacy single-device speed check (not in main nav) |

Unknown routes redirect to Dashboard.

## Environment variables

### Frontend (`.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend base URL |
| `VITE_USE_MOCK` | `false` | `true` = mock data only; omit or `false` = real API |

### Backend (`server/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5433/fleet_monitor` | PostgreSQL connection |
| `PORT` | `3001` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |
| `DATABASE_SSL` | `false` | Set `true` for hosted Postgres requiring TLS |
| `NODE_ENV` | `development` | `production` on Vercel |

**Never commit `.env` files or expose database credentials to the frontend.**

## API documentation

- Task 1 (GPS ingest): `server/docs/API_TASK1.md`
- Task 2 (rules/alerts): `server/docs/API_TASK2.md`
- Task 3 (trips/risk): `server/docs/API_TASK3.md`
- Deployment: `docs/DEPLOYMENT.md`

## Testing

With the backend running (`npm run dev` in `server/`):

```bash
cd server
npm run test:rules    # Task 2 rule engine
npm run test:task3    # Task 3 trips + risk + summary
```

## Production build

```bash
# Frontend
npm run build
npm run preview       # optional local preview

# Backend
cd server
npm start
```

## Mock mode

Set `VITE_USE_MOCK=true` to run the UI without a backend. All fleet pages use `src/api/mock.js`. Mock mode is for UI-only development — demos and integration testing should use `VITE_USE_MOCK=false`.

## Seeded vehicles

| Plate | ID | Driver |
|-------|-----|--------|
| AB12 CDE | `11111111-1111-1111-1111-111111111101` | Alex Morgan |
| XY34 FGH | `11111111-1111-1111-1111-111111111102` | Jordan Lee |
| LM56 NPQ | `11111111-1111-1111-1111-111111111103` | (unassigned) |

## Scripts

```bash
npm run dev       # frontend dev server
npm run build     # production build
npm run preview   # preview production build
```

Backend scripts are in `server/package.json` (`db:reset`, `test:rules`, `test:task3`, etc.).

## Note

This product is for operational monitoring and university project demos. GPS estimates can vary; do not treat the app as a legal speedometer or sole compliance system.

## Vercel Deployment

Deploy as **two separate Vercel projects** from this repository.

### Frontend deployment

1. In Vercel, click **Add New → Project** and import this repository.
2. **Project name:** e.g. `speedchecker-frontend`
3. **Root Directory:** leave as repository root (`.`)
4. **Framework Preset:** Vite (auto-detected)
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. **Environment Variables** (Production + Preview):
   - `VITE_API_URL` = `https://YOUR-BACKEND-PROJECT.vercel.app/api`
   - `VITE_USE_MOCK` = `false`
8. Deploy. Copy the deployment URL (e.g. `https://speedchecker-frontend.vercel.app`).

### Backend deployment

1. Create a **second** Vercel project from the same repository.
2. **Project name:** e.g. `speedchecker-backend`
3. **Root Directory:** `server`
4. **Framework Preset:** Other
5. **Build Command:** leave empty
6. **Environment Variables** (Production + Preview):
   - `DATABASE_URL` = your hosted PostgreSQL connection string
   - `DATABASE_SSL` = `true` (if provider requires SSL and URL has no `sslmode=require`)
   - `CORS_ORIGIN` = `https://YOUR-FRONTEND-PROJECT.vercel.app`
   - `NODE_ENV` = `production`
7. Deploy. Verify: `GET https://YOUR-BACKEND-PROJECT.vercel.app/api/health`

### PostgreSQL

1. Create a hosted PostgreSQL database (Neon, Supabase, Render, etc.).
2. Set `DATABASE_URL` in the **backend** Vercel project.
3. Initialize schema once from your machine:
   ```bash
   cd server
   # DATABASE_URL in server/.env pointing to hosted DB
   npm run db:reset
   ```

### Connecting frontend to backend

After both projects deploy:

1. Set frontend `VITE_API_URL` to `https://YOUR-BACKEND-PROJECT.vercel.app/api`
2. Set backend `CORS_ORIGIN` to `https://YOUR-FRONTEND-PROJECT.vercel.app`
3. **Redeploy both** after updating environment variables (frontend vars are build-time).

### Deployment checklist

```
[ ] PostgreSQL production database created
[ ] Database schema initialized
[ ] Backend deployed to Vercel (root = server)
[ ] Backend /api/health works
[ ] Backend database connection works
[ ] Frontend deployed to Vercel (repo root)
[ ] VITE_API_URL configured
[ ] CORS_ORIGIN configured
[ ] Frontend loads
[ ] Dashboard works
[ ] Map works
[ ] Alerts work
[ ] Trips work
[ ] Trip details work
[ ] Simulator works
[ ] Risk scoring works
[ ] Weekly summary works
[ ] No localhost production URLs
[ ] No secrets committed
```

Full details: `docs/DEPLOYMENT.md`
