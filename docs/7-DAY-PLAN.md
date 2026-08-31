# 7-Day Fleet Monitor — Narrow Scope & Plan

## What we are building (demo-ready MVP)

A **web dashboard** that receives GPS points from a **simulator** (standing in for real trackers), stores trips in PostgreSQL, flags rule violations, shows routes on a map, and displays AI risk scores.

**One sentence:** Managers open a browser, see where vehicles went, how fast they drove, what rules were broken, and which trips were risky.

---

## IN scope (must ship)

| Feature | Owner | Notes |
|---------|-------|-------|
| GPS simulator UI | Dev 1 | Sends points to `POST /api/gps/ingest` |
| 3 seeded vehicles | Dev 2 | SQL seed script |
| Haversine speed calc | Dev 2 | On every ingest |
| Trip storage + history | Dev 2 | |
| Live fleet map (Leaflet) | Dev 1 | Markers + route polylines |
| Overspeed detection | Dev 2 | Per-vehicle limit |
| Circle geofence alerts | Dev 2 | 2 seeded zones |
| Out-of-hours detection | Dev 2 | Mon–Fri 08:00–18:00 |
| Route deviation | Dev 2 | >500m from planned polyline |
| Alerts list + acknowledge | Dev 1 + Dev 2 | |
| Trip detail page with map | Dev 1 | |
| Risk score on completed trips | Dev 2 | Rules or lightweight model |
| Weekly summary panel | Dev 1 displays, Dev 2 API | |
| Manager dashboard home | Dev 1 | Stats + vehicle table |

## OUT of scope (explicitly cut)

- Real GPS tracker hardware integration
- Mobile app
- Login / auth / roles (open dashboard for demo)
- Vehicle/driver CRUD UI (seed data only)
- Email or push notifications
- PDF export
- Multi-company / multi-tenant
- Polygon geofences (circles only)
- Trip playback scrubber
- Custom hardware, fuel sensors

---

## Developer split

### Developer 1 (Frontend — this repo `/src`)
- React dashboard, routing, Leaflet map
- GPS simulator page
- Alerts, trips, trip detail UI
- API client + mock mode for parallel work
- Poll/refetch live vehicle positions every 5s

### Developer 2 (Backend — new `/server` folder)
- Node.js + Express API
- PostgreSQL schema + seeds
- GPS ingest, Haversine, business rules
- AI risk scoring on trip end
- Weekly summary endpoint

---

## 7-day schedule

### Day 1 — Contract & skeleton
- [x] API contract agreed (`docs/API_CONTRACT.md`)
- Dev 2: Express app, DB schema, migrations, seed data, `GET /health`
- Dev 1: Router, layout, dashboard shell, mock API, map component empty state

### Day 2 — Data flowing
- Dev 2: `POST /api/gps/ingest`, trip auto-create, Haversine speed, `GET /vehicles`
- Dev 1: Simulator UI (pick vehicle, send point / auto-play route), wire to real API

### Day 3 — Map & live view
- Dev 2: `GET /vehicles/live`, store readings with coords
- Dev 1: Fleet map with live markers, vehicle list on dashboard, 5s polling

### Day 4 — Rules & alerts
- Dev 2: Overspeed + geofence + out-of-hours rules → alerts table
- Dev 1: Alerts page, alert badges on dashboard, toast/banner on new alert

### Day 5 — Trips & routes
- Dev 2: Route deviation rule, planned route seed, `GET /trips`, `GET /trips/:id`
- Dev 1: Trip history table, trip detail with route polyline + alert markers on map

### Day 6 — AI & summary
- Dev 2: Risk scoring on `POST /trips/:id/end`, `GET /summary/weekly`
- Dev 1: Risk badges on trips, weekly summary panel, end-trip button in simulator

### Day 7 — Integration & demo
- Both: End-to-end test with 3 simulated trips (one clean, one overspeed, one geofence breach)
- Fix bugs, polish UI, write 5-minute demo script
- Deploy: frontend (Vercel/Netlify) + backend (Render/Railway) + DB (Supabase/Neon)

---

## Demo script (5 minutes)

1. Open dashboard → 3 vehicles listed, map centered on fleet area
2. Start simulator for Vehicle 1 → drive normal route within hours → green status
3. Vehicle 2 → simulate overspeed → alert appears, marker turns red
4. Vehicle 3 → simulate entry into restricted geofence → critical alert
5. End trips → show risk scores (low / medium / high)
6. Open trip detail → route on map, alert pins, speed in sidebar
7. Weekly summary → alert counts and top risky vehicle

---

## Dev 2 setup checklist

1. Create PostgreSQL (local Docker or Supabase free tier)
2. Copy `.env.example` → `.env` with `DATABASE_URL`
3. Run migrations + seed
4. Start server on port 3001
5. Confirm `GET http://localhost:3001/api/health`

Frontend runs with `VITE_API_URL=http://localhost:3001/api`.  
Set `VITE_USE_MOCK=true` to develop without backend.
