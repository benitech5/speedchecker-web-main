# API — Task 2 (Rules & Alerts)

Base URL: `http://localhost:3001/api`  
Timezone for out-of-hours: **GMT** via `Africa/Accra` (Mon–Fri 08:00–18:00 inclusive start, exclusive end). Ghana does not observe DST.

---

## Alert types

| type | severity | When |
|------|----------|------|
| `overspeed` | `warning` | Speed > limit for **2 consecutive** readings |
| `overspeed` | `critical` | Speed > limit × 1.20 (immediate, no streak) |
| `restricted_zone` | `critical` | Inside a `restricted` geofence circle |
| `out_of_hours` | `warning` | Moving outside Mon–Fri 08:00–18:00 GMT (`Africa/Accra`) |
| `route_deviation` | `warning` | > 500 m from planned route polyline |

## Deduplication

Table `rule_states` tracks open events per `(vehicle_id, trip_id, rule_key)`.

**One continuous violation = one alert.** A new alert is created only after the violation ends and starts again.

---

## GET /api/alerts

Query (optional): `vehicleId`, `severity`, `type`, `acknowledged` (`true`/`false`)

```json
[
  {
    "id": "...",
    "vehicleId": "11111111-1111-1111-1111-111111111101",
    "tripId": "...",
    "plateNumber": "AB12 CDE",
    "type": "overspeed",
    "severity": "warning",
    "message": "AB12 CDE overspeed: 90.0 km/h exceeded limit of 80 km/h",
    "latitude": 6.70,
    "longitude": -1.61,
    "acknowledged": false,
    "createdAt": "2026-08-25T10:00:20.000Z"
  }
]
```

## PATCH /api/alerts/:id/acknowledge

Sets `acknowledged` to `true`. Returns the updated alert. `404` if missing.

## GET /api/geofences

```json
[
  {
    "id": "44444444-4444-4444-4444-444444444401",
    "name": "Company Depot",
    "type": "allowed",
    "centerLat": 6.6885,
    "centerLng": -1.6244,
    "radiusM": 200
  }
]
```

## POST /api/gps/ingest (updated)

Same request as Task 1. Response `alerts` array now contains **newly created** alerts for that reading (may be empty).

---

## Database change (Task 2)

`rule_states(vehicle_id, trip_id, rule_key, active, streak, updated_at)` — deduplication only.

Apply without full reset: `npm run db:migrate:task2`
