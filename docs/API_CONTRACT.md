# API Contract — Fleet Monitor (7-Day MVP)

**Frontend base URL:** `VITE_API_URL` (default `http://localhost:3001/api`)  
**Backend owner:** Developer 2  
**Database:** PostgreSQL  

Both developers must implement against this contract from Day 1. Frontend uses mock data until endpoints are live.

---

## Conventions

- All timestamps: ISO 8601 UTC (`2026-08-22T14:30:00.000Z`)
- Coordinates: WGS84 decimal degrees
- Speed: km/h (calculated server-side via Haversine)
- Distances: metres unless noted

---

## Entities (Dev 2 creates in PostgreSQL)

### vehicles
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| plate_number | VARCHAR | e.g. `AB12 CDE` |
| label | VARCHAR | e.g. `Delivery Van 1` |
| speed_limit_kmh | INT | default 80 |
| status | ENUM | `idle`, `active`, `offline` |

### drivers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | |
| phone | VARCHAR | optional |

### trips
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| vehicle_id | UUID | FK |
| driver_id | UUID | FK, nullable |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | null while active |
| speed_limit_kmh | INT | copied from vehicle at start |
| risk_score | INT | 0–100, set on trip end by AI module |
| risk_label | ENUM | `low`, `medium`, `high` |

### gps_readings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| trip_id | UUID | FK |
| vehicle_id | UUID | FK |
| latitude | DECIMAL | |
| longitude | DECIMAL | |
| speed_kmh | DECIMAL | server-calculated |
| distance_m | DECIMAL | from previous point |
| recorded_at | TIMESTAMP | from tracker/simulator |

### geofences
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | e.g. `Depot`, `Restricted Zone A` |
| type | ENUM | `restricted`, `allowed` |
| center_lat | DECIMAL | circle geofence |
| center_lng | DECIMAL | |
| radius_m | INT | |

### alerts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| trip_id | UUID | FK |
| vehicle_id | UUID | FK |
| type | ENUM | `overspeed`, `geofence`, `out_of_hours`, `route_deviation` |
| severity | ENUM | `info`, `warning`, `critical` |
| message | TEXT | human-readable |
| latitude | DECIMAL | optional |
| longitude | DECIMAL | optional |
| created_at | TIMESTAMP | |
| acknowledged | BOOLEAN | default false |

### planned_routes (optional, for route deviation)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR | |
| waypoints | JSONB | `[{lat, lng}, ...]` ordered polyline |

---

## Seed data (Dev 2 provides)

Minimum for demo:
- 3 vehicles, 2 drivers
- 2 geofences (1 restricted, 1 allowed/depot)
- 1 planned route with 5–10 waypoints
- Working hours rule: Mon–Fri 08:00–18:00 (hardcoded in backend OK)

Suggested demo area: pick one city cluster (e.g. London -0.12, 51.5) so map looks coherent.

---

## Endpoints

### Health
```
GET /api/health
→ { "status": "ok", "db": "connected" }
```

### GPS ingestion (simulator + tracker)
```
POST /api/gps/ingest
Body: {
  "vehicleId": "uuid",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "timestamp": "2026-08-22T14:30:00.000Z"
}
→ {
  "tripId": "uuid",
  "speedKmh": 45.2,
  "alerts": [{ "type": "overspeed", "message": "..." }]  // new alerts from this point
}
```

**Server logic on each ingest:**
1. Find or create active trip for vehicle
2. Compare with previous reading → Haversine distance → speed
3. Check rules: overspeed, geofence, out-of-hours, route deviation
4. Insert reading + any new alerts
5. Return computed speed + new alerts

### Vehicles
```
GET /api/vehicles
→ [{ id, plateNumber, label, speedLimitKmh, status, driverName?, lastLat?, lastLng?, lastSpeedKmh?, activeTripId? }]
```

```
GET /api/vehicles/live
→ [{ vehicleId, plateNumber, label, latitude, longitude, speedKmh, heading?, tripId, updatedAt }]
```

### Trips
```
GET /api/trips?from=2026-08-15&to=2026-08-22&vehicleId=
→ [{ id, vehicleId, plateNumber, driverName, startedAt, endedAt, readingCount, alertCount, riskScore, riskLabel }]
```

```
GET /api/trips/:id
→ {
  id, vehicleId, plateNumber, driverName, startedAt, endedAt,
  speedLimitKmh, riskScore, riskLabel,
  readings: [{ latitude, longitude, speedKmh, distanceM, recordedAt }],
  alerts: [{ id, type, severity, message, latitude, longitude, createdAt, acknowledged }],
  route: { waypoints: [{lat, lng}] }  // planned route if assigned
}
```

```
POST /api/trips/:id/end
→ { id, endedAt, riskScore, riskLabel }
```

### Alerts
```
GET /api/alerts?acknowledged=false&limit=50
→ [{ id, tripId, vehicleId, plateNumber, type, severity, message, latitude, longitude, createdAt, acknowledged }]
```

```
PATCH /api/alerts/:id/acknowledge
→ { id, acknowledged: true }
```

### Geofences (read-only for frontend)
```
GET /api/geofences
→ [{ id, name, type, centerLat, centerLng, radiusM }]
```

### Weekly summary
```
GET /api/summary/weekly?week=2026-W34
→ {
  weekStart, weekEnd,
  totalTrips, totalAlerts,
  alertsByType: { overspeed: 5, geofence: 2, out_of_hours: 1, route_deviation: 3 },
  avgRiskScore,
  topRiskyVehicles: [{ plateNumber, riskScore, alertCount }],
  topRiskyDrivers: [{ name, riskScore, alertCount }]
}
```

---

## Business rules (Dev 2 implements)

| Rule | Trigger | Severity |
|------|---------|----------|
| Overspeed | speed > vehicle speed_limit for 2 consecutive readings | warning |
| Overspeed critical | speed > limit × 1.2 | critical |
| Restricted geofence | point inside `restricted` circle | critical |
| Out of hours | trip reading outside Mon–Fri 08:00–18:00 | warning |
| Route deviation | point > 500m from planned route polyline | warning |

---

## AI risk scoring (Dev 2 — trip end)

Input features (computed from trip):
- overspeed_count, max_speed_ratio, geofence_entries, out_of_hours_minutes, route_deviation_count, avg_speed

Output stored on trip:
- `risk_score` 0–100
- `risk_label`: low (0–33), medium (34–66), high (67–100)

Frontend only displays these fields — no ML in frontend.

---

## CORS

Allow `http://localhost:5173` (Vite dev) and production frontend URL.

---

## Error format

```json
{ "error": "Human readable message", "code": "VALIDATION_ERROR" }
```

HTTP codes: 400 validation, 404 not found, 500 server error.
