# Deployment Guide

This project is ready for deployment with separate frontend and backend services plus a hosted PostgreSQL database. **Do not commit credentials.**

## Recommended stack

| Component | Service options |
|-----------|-----------------|
| Frontend | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) |
| Backend | [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io) |
| Database | [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render PostgreSQL](https://render.com/docs/databases) |

## 1. PostgreSQL (hosted)

1. Create a PostgreSQL database on your provider.
2. Note the connection string, e.g.:
   ```
   postgresql://user:password@host:5432/fleet_monitor?sslmode=require
   ```
3. Run schema + seed once from your machine:
   ```bash
   cd server
   # Set DATABASE_URL to the hosted connection string in .env
   npm run db:reset
   ```
   Or run `npm run db:setup` then `npm run db:seed` if data already exists.

## 2. Backend (Render example)

1. Create a **Web Service** connected to this repo.
2. **Root directory:** `server`
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. **Environment variables:**

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your hosted PostgreSQL URL |
   | `PORT` | `3001` (or leave unset if platform sets `PORT`) |
   | `CORS_ORIGIN` | Your frontend URL, e.g. `https://your-app.vercel.app` |

6. Deploy and verify: `GET https://your-api.onrender.com/api/health` → `{ "status": "ok" }`

### Backend production notes

- Render free tier may sleep — first request can be slow.
- Ensure SSL is enabled on PostgreSQL (`sslmode=require` if required).
- Do not expose `DATABASE_URL` to the frontend.

## 3. Frontend (Vercel example)

1. Import the repo into Vercel.
2. **Root directory:** project root (not `server/`)
3. **Build command:** `npm run build`
4. **Output directory:** `dist`
5. **Environment variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://your-api.onrender.com/api` |
   | `VITE_USE_MOCK` | `false` |

6. Deploy and open the Vercel URL.

### CORS

The backend `CORS_ORIGIN` must include your deployed frontend URL. Multiple origins:

```
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173
```

## 4. Post-deploy verification

1. Open the deployed frontend → Dashboard loads without errors.
2. Simulator → send GPS points → Map shows vehicle movement.
3. End trip → Trips page shows completed trip with risk label.
4. Alerts page shows rule-generated alerts.

## 5. Environment variable checklist

### Frontend (build-time)

```
VITE_API_URL=https://YOUR-BACKEND-HOST/api
VITE_USE_MOCK=false
```

### Backend (runtime)

```
DATABASE_URL=postgresql://...
PORT=3001
CORS_ORIGIN=https://YOUR-FRONTEND-HOST
```

## 6. What is NOT included

- Authentication / user login
- Email or push notifications
- CI/CD pipeline (add GitHub Actions if needed)
- Custom domain setup (follow your host's docs)

## 7. Local vs production

| | Local | Production |
|---|-------|------------|
| Frontend | `http://localhost:5173` | Vercel/Netlify URL |
| Backend | `http://localhost:3001` | Render/Railway URL |
| Database | Local PostgreSQL | Neon/Supabase/etc. |
| CORS | `http://localhost:5173` | Production frontend URL |

## 8. Troubleshooting

| Problem | Check |
|---------|-------|
| "Unable to connect to server" | Backend running? `VITE_API_URL` correct? |
| CORS error in browser | `CORS_ORIGIN` includes frontend URL |
| Empty trips/alerts | Run simulator; check `DATABASE_URL` and seed |
| Build fails | Run `npm run build` locally; fix import errors |
| Health OK but DB errors | `DATABASE_URL` valid; migrations/seed applied |
