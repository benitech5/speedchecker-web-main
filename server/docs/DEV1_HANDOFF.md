# Dev Handoff — Frontend Integration (Task 4 complete)

All fleet manager features use the real backend when `VITE_USE_MOCK=false`.

## Environment

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK=false
```

Backend: `cd server && npm run dev` (after `npm run db:reset` or migrations).

## Live pages

| Page | API |
|------|-----|
| Dashboard | `/vehicles/live`, `/alerts`, `/summary/weekly` |
| Map | `/vehicles/live`, `/geofences`, `/alerts` |
| Alerts | `/alerts`, `PATCH /alerts/:id/acknowledge` |
| Trips | `/trips` |
| Trip Detail | `/trips/:id` |
| Simulator | `POST /gps/ingest`, `POST /trips/:id/end` |

## Mock mode

Set `VITE_USE_MOCK=true` for offline UI work only. Sidebar shows a "Mock data mode" badge.

`src/api/mock.js` is retained as dev fallback — not used in normal demo/integration mode.

## Simulator scenarios

| Mode | Vehicle (demo) | Expected |
|------|----------------|----------|
| Normal Route | AB12 CDE | Low risk, no alerts |
| Overspeed Route | XY34 FGH | Overspeed alert, medium risk |
| Restricted-Area | LM56 NPQ | Critical geofence alert |
| Route Deviation | any | route_deviation alert |
| Out-of-Hours | any | out_of_hours alert (Saturday timestamp) |

## Docs

- `docs/API_TASK1.md`, `API_TASK2.md`, `API_TASK3.md`
- `../docs/DEPLOYMENT.md`
- `../README.md`

## Previous Task 2 notes

## 6. Step-by-step for Dev 1

1. Confirm root `.env` has `VITE_USE_MOCK=false` and `VITE_API_URL=http://localhost:3001/api`
2. Ask Dev 2 (or yourself) to run `npm run db:migrate:task2` once if DB was from Task 1 only
3. Run backend `npm run dev` and frontend `npm run dev`
4. Open Alerts — should load from API (may be empty until you simulate)
5. Simulate GPS; confirm new alerts appear without page redesign
6. Acknowledge an alert; refresh — stays acknowledged
7. Do **not** implement rules in React; do **not** start risk/AI UI wiring yet

## Docs

- `server/docs/API_TASK2.md`
- `server/README.md`
