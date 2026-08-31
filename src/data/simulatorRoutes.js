/** Deterministic preset routes — Kumasi / Ashanti Region, Ghana */

/**
 * Each mode uses simulated timestamps (not wall clock) so Haversine speed
 * matches the intended scenario. elapsedMsPerPoint controls time between readings.
 */
export const ROUTE_MODES = {
  normal: {
    label: 'Normal Route',
    description: 'Weekday working hours · ~18 km/h · no violations expected',
    elapsedMsPerPoint: 10_000,
    startTime: '2026-08-25T10:00:00.000Z',
    points: [
      { latitude: 6.6885, longitude: -1.6244 },
      { latitude: 6.68895, longitude: -1.6244 },
      { latitude: 6.68940, longitude: -1.6244 },
      { latitude: 6.68985, longitude: -1.6244 },
      { latitude: 6.69030, longitude: -1.6244 },
    ],
  },
  overspeed: {
    label: 'Overspeed Route',
    description: 'Weekday · ~90 km/h segments · triggers overspeed after 2 readings',
    elapsedMsPerPoint: 10_000,
    startTime: '2026-08-25T11:00:00.000Z',
    points: [
      { latitude: 6.6885, longitude: -1.6244 },
      { latitude: 6.69075, longitude: -1.6244 },
      { latitude: 6.69300, longitude: -1.6244 },
      { latitude: 6.69525, longitude: -1.6244 },
      { latitude: 6.69750, longitude: -1.6244 },
    ],
  },
  restricted: {
    label: 'Restricted-Area Route',
    description: 'Enters Restricted Zone A (6.702, -1.605) · critical geofence alert',
    elapsedMsPerPoint: 10_000,
    startTime: '2026-08-25T12:00:00.000Z',
    points: [
      { latitude: 6.6885, longitude: -1.6244 },
      { latitude: 6.6930, longitude: -1.6180 },
      { latitude: 6.6980, longitude: -1.6110 },
      { latitude: 6.7020, longitude: -1.6050 },
      { latitude: 6.7025, longitude: -1.6045 },
    ],
  },
  deviation: {
    label: 'Route Deviation',
    description: 'Leaves planned corridor · triggers route_deviation alert',
    elapsedMsPerPoint: 10_000,
    startTime: '2026-08-25T13:00:00.000Z',
    points: [
      { latitude: 6.6885, longitude: -1.6244 },
      { latitude: 6.6910, longitude: -1.6200 },
      { latitude: 6.6700, longitude: -1.6244 },
      { latitude: 6.6695, longitude: -1.6250 },
      { latitude: 6.6910, longitude: -1.6200 },
    ],
  },
  outOfHours: {
    label: 'Out-of-Hours Route',
    description: 'Saturday movement · triggers out_of_hours alert',
    elapsedMsPerPoint: 10_000,
    startTime: '2026-08-22T12:00:00.000Z',
    points: [
      { latitude: 6.6885, longitude: -1.6244 },
      { latitude: 6.68935, longitude: -1.6244 },
      { latitude: 6.69020, longitude: -1.6244 },
      { latitude: 6.69105, longitude: -1.6244 },
      { latitude: 6.69190, longitude: -1.6244 },
    ],
  },
};

export const SIMULATION_INTERVAL_MS = 2000;

/** Seeded vehicle IDs (match backend seed.sql) */
export const SEEDED_VEHICLES = {
  van1: '11111111-1111-1111-1111-111111111101',
  car2: '11111111-1111-1111-1111-111111111102',
  pool3: '11111111-1111-1111-1111-111111111103',
};
