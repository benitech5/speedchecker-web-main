# Deployment Guide

Deploy the **frontend** and **backend** as **two separate Vercel projects** from this repository, plus a hosted PostgreSQL database. **Do not commit credentials.**

## Recommended stack

| Component | Service |
|-----------|---------|
| Frontend | [Vercel](https://vercel.com) (repo root) |
| Backend | [Vercel](https://vercel.com) (`/server` root directory) |
| Database | [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render PostgreSQL](https://render.com/docs/databases) |

## 1. PostgreSQL (hosted)

1. Create a PostgreSQL database on your provider.
2. Copy the connection string, e.g.:
   ```
   postgresql://user:password@host:5432/fleet_monitor?sslmode=require
   ```
3. Initialize schema and seed data **once** from your machine (not from Vercel functions):
   ```bash
   cd server
   cp .env.example .env
   # Set DATABASE_URL to your hosted connection string
   npm install
   npm run db:reset
   ```
   Or run `npm run db:setup` then `npm run db:seed` if the database already exists.

   For upgrades on an existing database:
   ```bash
   npm run db:migrate:task2
   npm run db:migrate:task3
   ```

## 2. Backend (Vercel)

1. Create a **new Vercel project** and import this repository.
2. **Root Directory:** `server`
3. **Framework Preset:** Other (no build step required)
4. **Install Command:** `npm install` (default)
5. **Build Command:** leave empty
6. **Output Directory:** leave empty
7. Vercel reads `server/vercel.json`, which rewrites all routes to the serverless Express handler at `api/index.js`.
8. **Environment variables** (Vercel → Settings → Environment Variables):

   | Key | Required | Value |
   |-----|----------|-------|
   | `DATABASE_URL` | Yes | Your hosted PostgreSQL connection string |
   | `DATABASE_SSL` | No | `true` if provider requires SSL and URL has no `sslmode=require` |
   | `CORS_ORIGIN` | Yes | `https://YOUR-FRONTEND-PROJECT.vercel.app` (add `,http://localhost:5173` for local dev against prod API) |
   | `NODE_ENV` | No | `production` |

9. Deploy and verify:
   ```
   GET https://YOUR-BACKEND-PROJECT.vercel.app/api/health
   ```
   Expected: `{ "status": "ok", "database": "connected" }`

### Backend notes

- Database migrations and seeding run **manually** via `server/scripts/*` — never on function cold start.
- The connection pool is reused across serverless invocations (`globalThis`) with `max: 1` on Vercel.
- Do not expose `DATABASE_URL` to the frontend.

## 3. Frontend (Vercel)

1. Create a **second Vercel project** from the same repository.
2. **Root Directory:** repository root (leave blank / `.`)
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment variables** (build-time — redeploy after changes):

   | Key | Required | Value |
   |-----|----------|-------|
   | `VITE_API_URL` | Yes | `https://YOUR-BACKEND-PROJECT.vercel.app/api` |
   | `VITE_USE_MOCK` | No | `false` (omit or set explicitly; mock is opt-in via `true`) |

7. Deploy and open the Vercel URL.

### CORS

Set backend `CORS_ORIGIN` to your deployed frontend URL:

```
CORS_ORIGIN=https://YOUR-FRONTEND-PROJECT.vercel.app
```

For local frontend against a deployed backend:

```
CORS_ORIGIN=https://YOUR-FRONTEND-PROJECT.vercel.app,http://localhost:5173
```

## 4. Post-deploy verification

1. `GET https://YOUR-BACKEND-PROJECT.vercel.app/api/health` → database connected
2. Open deployed frontend → Dashboard loads without CORS errors
3. Simulator → send GPS points → Map shows vehicle movement
4. End trip → Trips page shows completed trip with risk label
5. Alerts page shows rule-generated alerts

## 5. Deployment checklist

```
[ ] PostgreSQL production database created
[ ] Database schema initialized (npm run db:reset from server/)
[ ] Backend deployed to Vercel (root directory = server)
[ ] Backend /api/health works
[ ] Backend database connection works
[ ] Frontend deployed to Vercel (repo root)
[ ] VITE_API_URL configured to backend URL
[ ] CORS_ORIGIN configured to frontend URL
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

## 6. Environment variable reference

### Frontend (build-time)

```
VITE_API_URL=https://YOUR-BACKEND-PROJECT.vercel.app/api
VITE_USE_MOCK=false
```

### Backend (runtime)

```
DATABASE_URL=postgresql://...
DATABASE_SSL=true
CORS_ORIGIN=https://YOUR-FRONTEND-PROJECT.vercel.app
NODE_ENV=production
```

## 7. Local vs production

| | Local | Production |
|---|-------|------------|
| Frontend | `http://localhost:5173` | `https://YOUR-FRONTEND-PROJECT.vercel.app` |
| Backend | `http://localhost:3001` | `https://YOUR-BACKEND-PROJECT.vercel.app` |
| Database | Local PostgreSQL | Neon/Supabase/etc. |
| CORS | `http://localhost:5173` | Production frontend URL |

## 8. Troubleshooting

| Problem | Check |
|---------|-------|
| "Unable to connect to server" | Backend deployed? `VITE_API_URL` includes `/api`? Redeploy frontend after env change |
| CORS error in browser | `CORS_ORIGIN` includes exact frontend URL (no trailing slash) |
| Health OK but DB errors | `DATABASE_URL` valid; `DATABASE_SSL=true` if needed; schema seeded |
| Empty trips/alerts | Run simulator; check seed data applied |
| Build fails | Run `npm run build` locally; fix import errors |
| 404 on API routes | Backend project root must be `server`; check `server/vercel.json` rewrites |

## 9. What is NOT included

- Authentication / user login
- Email or push notifications
- CI/CD pipeline (add GitHub Actions if needed)
- Custom domain setup (follow Vercel docs)
