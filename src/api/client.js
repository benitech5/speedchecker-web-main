import * as mock from './mock.js';

// Mock mode is opt-in only (VITE_USE_MOCK=true). Production builds default to the real backend.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

/**
 * When VITE_USE_MOCK=true, all requests use src/api/mock.js (offline UI dev).
 * Otherwise fleet features use the real backend at VITE_API_URL.
 */
const LIVE_PATHS = [
  '/health',
  '/vehicles',
  '/vehicles/live',
  '/gps/ingest',
  '/alerts',
  '/geofences',
  '/trips',
  '/summary/weekly',
];

function isLivePath(path) {
  const bare = path.split('?')[0];
  return LIVE_PATHS.some((p) => bare === p || bare.startsWith(`${p}/`));
}

async function request(path, options = {}) {
  const preferMock = USE_MOCK || !isLivePath(path);

  if (preferMock) {
    return mock.handle(path, options);
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error('Unable to connect to server. Is the API running on port 3001?');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Unexpected server response.');
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  getVehicles: () => request('/vehicles'),
  getLiveVehicles: () => request('/vehicles/live'),
  getTrips: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/trips${q ? `?${q}` : ''}`);
  },
  getTrip: (id) => request(`/trips/${id}`),
  endTrip: (id) => request(`/trips/${id}/end`, { method: 'POST' }),
  getAlerts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/alerts${q ? `?${q}` : ''}`);
  },
  acknowledgeAlert: (id) => request(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
  getGeofences: () => request('/geofences'),
  getWeeklySummary: (week) => request(`/summary/weekly${week ? `?week=${week}` : ''}`),
  ingestGps: (body) =>
    request('/gps/ingest', { method: 'POST', body: JSON.stringify(body) }),
};

/** True when all API calls use mock.js. False = live backend for fleet features. */
export const isMockMode = USE_MOCK;
