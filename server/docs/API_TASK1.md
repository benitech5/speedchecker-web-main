# Backend API — Task 1 Contract

Base URL: `http://localhost:3001/api`  
Naming: **camelCase** in JSON.

---

## GET /api/health

```json
{ "status": "ok", "database": "connected" }
```

---

## GET /api/vehicles

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111101",
    "plateNumber": "AB12 CDE",
    "label": "Delivery Van 1",
    "speedLimitKmh": 80,
    "status": "offline",
    "driverId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    "driverName": "Alex Morgan"
  }
]
```

---

## GET /api/vehicles/live

```json
[
  {
    "vehicleId": "11111111-1111-1111-1111-111111111101",
    "plateNumber": "AB12 CDE",
    "label": "Delivery Van 1",
    "status": "active",
    "speedLimitKmh": 80,
    "latitude": 6.6910,
    "longitude": -1.620,
    "speedKmh": 42.5,
    "updatedAt": "2026-08-25T12:00:10.000Z",
    "tripId": "..."
  }
]
```

If no GPS yet: `latitude`/`longitude`/`speedKmh`/`tripId` are `null`, `status` is `"offline"`.

---

## POST /api/gps/ingest

### Request

```json
{
  "vehicleId": "11111111-1111-1111-1111-111111111101",
  "latitude": 6.6885,
  "longitude": -1.6244,
  "timestamp": "2026-08-25T12:00:00.000Z"
}
```

### Success (201)

```json
{
  "tripId": "...",
  "vehicleId": "11111111-1111-1111-1111-111111111101",
  "readingId": "...",
  "latitude": 6.6885,
  "longitude": -1.6244,
  "speedKmh": 0,
  "distanceM": 0,
  "timestamp": "2026-08-25T12:00:00.000Z",
  "alerts": []
}
```

### Errors

| Status | Code | When |
|--------|------|------|
| 400 | VALIDATION_ERROR | Bad lat/lng/timestamp/body |
| 404 | VEHICLE_NOT_FOUND | Unknown vehicleId |
| 500 | SERVER_ERROR | Database failure |
