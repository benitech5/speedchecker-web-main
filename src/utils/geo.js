const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function distanceInKm(a, b) {
  const earthRadius = 6371;
  const lat = toRadians(b.latitude - a.latitude);
  const lon = toRadians(b.longitude - a.longitude);
  const value =
    Math.sin(lat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(lon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function speedFromPoints(prev, current) {
  const travelled = distanceInKm(prev, current);
  const elapsedHours = Math.max((current.timestamp - prev.timestamp) / 3600000, 1 / 3600000);
  return travelled / elapsedHours;
}

/** Kumasi, Ashanti Region */
export const DEMO_CENTER = { lat: 6.6885, lng: -1.6244 };

export const DEMO_ROUTES = {
  normal: [
    { lat: 6.6885, lng: -1.6244 },
    { lat: 6.6910, lng: -1.6200 },
    { lat: 6.6940, lng: -1.6150 },
    { lat: 6.6970, lng: -1.6100 },
    { lat: 6.7000, lng: -1.6060 },
  ],
  overspeed: [
    { lat: 6.6850, lng: -1.6300 },
    { lat: 6.6900, lng: -1.6180 },
    { lat: 6.6960, lng: -1.6050 },
    { lat: 6.7020, lng: -1.5920 },
  ],
  restricted: [
    { lat: 6.6885, lng: -1.6244 },
    { lat: 6.6930, lng: -1.6180 },
    { lat: 6.6980, lng: -1.6110 },
    { lat: 6.7020, lng: -1.6050 },
  ],
};
