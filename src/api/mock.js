/**
 * In-browser mock API for offline UI development (VITE_USE_MOCK=true).
 * With VITE_USE_MOCK=false, all fleet features use the real backend — mock.js is not called.
 */
export const MOCK_VEHICLES = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    plateNumber: 'AB12 CDE',
    label: 'Delivery Van 1',
    speedLimitKmh: 80,
    status: 'idle',
    driverName: 'Alex Morgan',
    lastLat: 6.6885,
    lastLng: -1.6244,
    lastSpeedKmh: 0,
    activeTripId: null,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    plateNumber: 'XY34 FGH',
    label: 'Service Car 2',
    speedLimitKmh: 80,
    status: 'active',
    driverName: 'Jordan Lee',
    lastLat: 6.6920,
    lastLng: -1.6185,
    lastSpeedKmh: 52,
    activeTripId: '22222222-2222-2222-2222-222222222202',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    plateNumber: 'LM56 NPQ',
    label: 'Pool Vehicle 3',
    speedLimitKmh: 80,
    status: 'offline',
    driverName: null,
    lastLat: 6.6855,
    lastLng: -1.6310,
    lastSpeedKmh: 0,
    activeTripId: null,
  },
];

export const MOCK_ALERTS = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    tripId: '22222222-2222-2222-2222-222222222201',
    vehicleId: '11111111-1111-1111-1111-111111111101',
    plateNumber: 'AB12 CDE',
    type: 'overspeed',
    severity: 'warning',
    message: 'Speed 92 km/h exceeded limit of 80 km/h',
    latitude: 6.6910,
    longitude: -1.620,
    createdAt: '2026-08-21T09:12:00.000Z',
    acknowledged: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    tripId: '22222222-2222-2222-2222-222222222201',
    vehicleId: '11111111-1111-1111-1111-111111111101',
    plateNumber: 'AB12 CDE',
    type: 'route_deviation',
    severity: 'warning',
    message: 'Vehicle deviated more than 500 m from planned route',
    latitude: 6.702,
    longitude: -1.610,
    createdAt: '2026-08-21T09:45:00.000Z',
    acknowledged: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    tripId: '22222222-2222-2222-2222-222222222204',
    vehicleId: '11111111-1111-1111-1111-111111111102',
    plateNumber: 'XY34 FGH',
    type: 'critical_overspeed',
    severity: 'critical',
    message: 'Vehicle XY34 FGH exceeded the speed limit (98 km/h > 80 km/h).',
    latitude: 6.696,
    longitude: -1.605,
    createdAt: '2026-08-19T11:00:20.000Z',
    acknowledged: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    tripId: '22222222-2222-2222-2222-222222222204',
    vehicleId: '11111111-1111-1111-1111-111111111102',
    plateNumber: 'XY34 FGH',
    type: 'restricted_zone',
    severity: 'critical',
    message: 'Vehicle XY34 FGH entered Restricted Zone A.',
    latitude: 6.702,
    longitude: -1.605,
    createdAt: '2026-08-19T11:00:40.000Z',
    acknowledged: false,
  },
];

/** Full trip records (list + detail). Mutated by mock ingest/end. */
export const MOCK_TRIPS = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    vehicleId: '11111111-1111-1111-1111-111111111101',
    plateNumber: 'AB12 CDE',
    driverName: 'Alex Morgan',
    startedAt: '2026-08-21T08:15:00.000Z',
    endedAt: '2026-08-21T10:42:00.000Z',
    speedLimitKmh: 80,
    status: 'completed',
    riskScore: 58,
    riskLabel: 'medium',
    riskFactors: [
      'Frequent overspeed events',
      'Multiple route deviations',
    ],
    readings: [
      { latitude: 6.6885, longitude: -1.6244, speedKmh: 0, distanceM: 0, recordedAt: '2026-08-21T08:15:00.000Z' },
      { latitude: 6.6910, longitude: -1.620, speedKmh: 48, distanceM: 220, recordedAt: '2026-08-21T08:15:10.000Z' },
      { latitude: 6.6940, longitude: -1.6150, speedKmh: 92, distanceM: 310, recordedAt: '2026-08-21T08:15:20.000Z' },
      { latitude: 6.6970, longitude: -1.6100, speedKmh: 55, distanceM: 280, recordedAt: '2026-08-21T08:15:30.000Z' },
      { latitude: 6.7000, longitude: -1.6060, speedKmh: 40, distanceM: 200, recordedAt: '2026-08-21T08:15:40.000Z' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    vehicleId: '11111111-1111-1111-1111-111111111103',
    plateNumber: 'LM56 NPQ',
    driverName: null,
    startedAt: '2026-08-20T14:00:00.000Z',
    endedAt: '2026-08-20T14:35:00.000Z',
    speedLimitKmh: 80,
    status: 'completed',
    riskScore: 18,
    riskLabel: 'low',
    riskFactors: [],
    readings: [
      { latitude: 6.6885, longitude: -1.6244, speedKmh: 0, distanceM: 0, recordedAt: '2026-08-20T14:00:00.000Z' },
      { latitude: 6.6910, longitude: -1.620, speedKmh: 40, distanceM: 220, recordedAt: '2026-08-20T14:00:10.000Z' },
      { latitude: 6.6940, longitude: -1.6150, speedKmh: 45, distanceM: 250, recordedAt: '2026-08-20T14:00:20.000Z' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    vehicleId: '11111111-1111-1111-1111-111111111102',
    plateNumber: 'XY34 FGH',
    driverName: 'Jordan Lee',
    startedAt: '2026-08-19T11:00:00.000Z',
    endedAt: '2026-08-19T11:40:00.000Z',
    speedLimitKmh: 80,
    status: 'completed',
    riskScore: 82,
    riskLabel: 'high',
    riskFactors: [
      'Critical overspeed events',
      'Entered restricted area',
    ],
    readings: [
      { latitude: 6.685, longitude: -1.63, speedKmh: 30, distanceM: 0, recordedAt: '2026-08-19T11:00:00.000Z' },
      { latitude: 6.6960, longitude: -1.6050, speedKmh: 98, distanceM: 900, recordedAt: '2026-08-19T11:00:20.000Z' },
      { latitude: 6.702, longitude: -1.605, speedKmh: 40, distanceM: 400, recordedAt: '2026-08-19T11:00:40.000Z' },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    vehicleId: '11111111-1111-1111-1111-111111111102',
    plateNumber: 'XY34 FGH',
    driverName: 'Jordan Lee',
    startedAt: '2026-08-22T09:00:00.000Z',
    endedAt: null,
    speedLimitKmh: 80,
    status: 'active',
    readings: [
      { latitude: 6.6920, longitude: -1.6185, speedKmh: 52, distanceM: 0, recordedAt: '2026-08-22T09:00:00.000Z' },
    ],
  },
];

export const MOCK_GEOFENCES = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    name: 'Company Depot',
    type: 'allowed',
    centerLat: 6.6885,
    centerLng: -1.6244,
    radiusM: 250,
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    name: 'Restricted Zone A',
    type: 'restricted',
    centerLat: 6.702,
    centerLng: -1.605,
    radiusM: 180,
  },
];

export const MOCK_WEEKLY_SUMMARY = {
  weekStart: '2026-08-18',
  weekEnd: '2026-08-24',
  totalTrips: 5,
  completedTrips: 4,
  totalAlerts: 7,
  criticalAlerts: 2,
  warningAlerts: 5,
  activeVehicles: 1,
  alertsByType: {
    overspeed: 3,
    restricted_zone: 1,
    out_of_hours: 1,
    route_deviation: 2,
  },
  avgRiskScore: 52,
  topRiskVehicle: {
    plateNumber: 'XY34 FGH',
    riskScore: 82,
    riskLabel: 'high',
    alertCount: 4,
  },
  topRiskyVehicles: [
    { plateNumber: 'XY34 FGH', riskScore: 82, riskLabel: 'high', alertCount: 4 },
    { plateNumber: 'AB12 CDE', riskScore: 58, riskLabel: 'medium', alertCount: 2 },
    { plateNumber: 'LM56 NPQ', riskScore: 18, riskLabel: 'low', alertCount: 0 },
  ],
  topRiskyDrivers: [
    { name: 'Jordan Lee', riskScore: 82, alertCount: 4 },
    { name: 'Alex Morgan', riskScore: 58, alertCount: 2 },
  ],
};

/** Mock-backend risk assignment (stand-in for Dev 2 AI) — not used by React UI */
function assignMockRisk(trip) {
  const alerts = MOCK_ALERTS.filter((a) => a.tripId === trip.id);
  const factors = [];
  let score = 12;

  const overspeed = alerts.filter((a) => a.type === 'overspeed' || a.type === 'critical_overspeed');
  const restricted = alerts.filter((a) => a.type === 'restricted_zone' || a.type === 'geofence');
  const deviation = alerts.filter((a) => a.type === 'route_deviation');
  const outHours = alerts.filter((a) => a.type === 'out_of_hours');

  if (overspeed.length) {
    score += overspeed.length * 18;
    factors.push(overspeed.some((a) => a.severity === 'critical')
      ? 'Critical overspeed events'
      : 'Frequent overspeed events');
  }
  if (restricted.length) {
    score += 35;
    factors.push('Entered restricted area');
  }
  if (deviation.length) {
    score += deviation.length * 12;
    factors.push('Multiple route deviations');
  }
  if (outHours.length) {
    score += 15;
    factors.push('Out-of-hours movement');
  }

  score = Math.min(100, score);
  const riskLabel = score >= 67 ? 'high' : score >= 34 ? 'medium' : 'low';
  trip.riskScore = score;
  trip.riskLabel = riskLabel;
  trip.riskFactors = factors;
  return { riskScore: score, riskLabel };
}

function tripSummary(trip) {
  const alerts = MOCK_ALERTS.filter((a) => a.tripId === trip.id);
  return {
    id: trip.id,
    vehicleId: trip.vehicleId,
    plateNumber: trip.plateNumber,
    driverName: trip.driverName,
    startedAt: trip.startedAt,
    endedAt: trip.endedAt,
    status: trip.endedAt ? 'completed' : 'active',
    readingCount: trip.readings?.length ?? 0,
    alertCount: alerts.length,
    speedLimitKmh: trip.speedLimitKmh,
    riskScore: trip.riskScore ?? null,
    riskLabel: trip.riskLabel ?? null,
  };
}

function tripDetail(trip) {
  return {
    ...tripSummary(trip),
    riskFactors: trip.riskFactors || [],
    readings: [...(trip.readings || [])],
    alerts: MOCK_ALERTS.filter((a) => a.tripId === trip.id),
  };
}

function ensureActiveTrip(vehicle) {
  if (vehicle.activeTripId) {
    const existing = MOCK_TRIPS.find((t) => t.id === vehicle.activeTripId && !t.endedAt);
    if (existing) return existing;
  }

  const trip = {
    id: `trip-${Date.now()}-${vehicle.id.slice(-4)}`,
    vehicleId: vehicle.id,
    plateNumber: vehicle.plateNumber,
    driverName: vehicle.driverName,
    startedAt: new Date().toISOString(),
    endedAt: null,
    speedLimitKmh: vehicle.speedLimitKmh,
    status: 'active',
    readings: [],
  };
  MOCK_TRIPS.unshift(trip);
  vehicle.activeTripId = trip.id;
  return trip;
}

export async function handle(path, options = {}) {
  await delay(200);

  if (path === '/health') {
    return { status: 'ok', db: 'mock' };
  }
  if (path === '/vehicles') {
    return MOCK_VEHICLES;
  }
  if (path === '/vehicles/live') {
    return MOCK_VEHICLES.map((v) => ({
      vehicleId: v.id,
      plateNumber: v.plateNumber,
      label: v.label,
      latitude: v.lastLat,
      longitude: v.lastLng,
      speedKmh: v.lastSpeedKmh ?? 0,
      status: v.status,
      tripId: v.activeTripId,
      updatedAt: v.updatedAt ?? new Date().toISOString(),
    }));
  }

  if (path.startsWith('/trips/') && path.endsWith('/end') && options.method === 'POST') {
    const id = path.split('/')[2];
    const trip = MOCK_TRIPS.find((t) => t.id === id);
    if (!trip) throw new Error('Trip not found');
    trip.endedAt = new Date().toISOString();
    trip.status = 'completed';
    const risk = assignMockRisk(trip);
    const vehicle = MOCK_VEHICLES.find((v) => v.id === trip.vehicleId);
    if (vehicle && vehicle.activeTripId === trip.id) {
      vehicle.activeTripId = null;
      vehicle.status = 'idle';
      vehicle.lastSpeedKmh = 0;
    }
    return { id: trip.id, endedAt: trip.endedAt, ...risk };
  }

  if (path.startsWith('/trips/') && !path.includes('?')) {
    const id = path.split('/')[2];
    const trip = MOCK_TRIPS.find((t) => t.id === id);
    if (!trip) throw new Error('Trip not found');
    return tripDetail(trip);
  }

  if (path.startsWith('/trips')) {
    return MOCK_TRIPS.map(tripSummary);
  }

  if (path.startsWith('/alerts/') && path.endsWith('/acknowledge')) {
    const id = path.split('/')[2];
    const alert = MOCK_ALERTS.find((a) => a.id === id);
    if (alert) alert.acknowledged = true;
    return { id, acknowledged: true };
  }
  if (path.startsWith('/alerts')) {
    const params = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '');
    let list = [...MOCK_ALERTS];
    if (params.get('acknowledged') === 'false') {
      list = list.filter((a) => !a.acknowledged);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (path === '/geofences') {
    return MOCK_GEOFENCES;
  }
  if (path.startsWith('/summary/weekly')) {
    return MOCK_WEEKLY_SUMMARY;
  }

  if (path === '/gps/ingest' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const vehicle = MOCK_VEHICLES.find((v) => v.id === body.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found');

    const newAlerts = [];
    const isOverspeedRoutePoint =
      Math.abs(body.latitude - 6.696) < 0.003 || Math.abs(body.latitude - 6.708) < 0.003;
    const isRestrictedPoint =
      Math.abs(body.latitude - 6.702) < 0.002 && Math.abs(body.longitude - (-1.605)) < 0.003;

    let speedKmh = 42.5;
    if (isOverspeedRoutePoint) speedKmh = 98;
    else if (isRestrictedPoint) speedKmh = 35;

    const trip = ensureActiveTrip(vehicle);
    const prev = trip.readings[trip.readings.length - 1];
    const reading = {
      latitude: body.latitude,
      longitude: body.longitude,
      speedKmh,
      distanceM: prev ? 250 : 0,
      recordedAt: body.timestamp ?? new Date().toISOString(),
    };
    trip.readings.push(reading);

    vehicle.lastLat = body.latitude;
    vehicle.lastLng = body.longitude;
    vehicle.lastSpeedKmh = speedKmh;
    vehicle.status = 'active';
    vehicle.updatedAt = reading.recordedAt;
    vehicle.activeTripId = trip.id;

    if (isOverspeedRoutePoint) {
      const alert = {
        id: `alert-${Date.now()}-${MOCK_ALERTS.length}`,
        tripId: trip.id,
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        type: speedKmh > 96 ? 'critical_overspeed' : 'overspeed',
        severity: speedKmh > 96 ? 'critical' : 'warning',
        message: `Vehicle ${vehicle.plateNumber} exceeded the speed limit (${speedKmh} km/h > ${vehicle.speedLimitKmh} km/h).`,
        latitude: body.latitude,
        longitude: body.longitude,
        createdAt: reading.recordedAt,
        acknowledged: false,
      };
      MOCK_ALERTS.unshift(alert);
      newAlerts.push(alert);
    }

    if (isRestrictedPoint) {
      const alert = {
        id: `alert-${Date.now()}-rz-${MOCK_ALERTS.length}`,
        tripId: trip.id,
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        type: 'restricted_zone',
        severity: 'critical',
        message: `Vehicle ${vehicle.plateNumber} entered Restricted Zone A.`,
        latitude: body.latitude,
        longitude: body.longitude,
        createdAt: reading.recordedAt,
        acknowledged: false,
      };
      MOCK_ALERTS.unshift(alert);
      newAlerts.push(alert);
    }

    return {
      tripId: trip.id,
      speedKmh,
      alerts: newAlerts,
      accepted: true,
      vehicleId: body.vehicleId,
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: body.timestamp,
    };
  }

  throw new Error(`Mock route not found: ${path}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
