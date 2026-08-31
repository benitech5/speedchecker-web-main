/**
 * Feature extraction from stored GPS readings and alerts.
 * Separated from risk scoring so the model can be swapped later.
 */

/**
 * @typedef {Object} TripFeatures
 * @property {number|null} averageSpeedKmh
 * @property {number|null} maximumSpeedKmh
 * @property {number|null} speedLimitKmh
 * @property {number|null} maximumSpeedRatio
 * @property {number} overspeedCount
 * @property {number} criticalOverspeedCount
 * @property {number} restrictedZoneViolations
 * @property {number} outOfHoursViolations
 * @property {number} routeDeviationViolations
 * @property {number} totalAlertCount
 * @property {number|null} tripDurationSeconds
 * @property {number} readingCount
 * @property {number} distanceTravelledM
 */

function countAlertsByType(alerts, type, severity = null) {
  return alerts.filter((a) => {
    if (a.type !== type) return false;
    if (severity && a.severity !== severity) return false;
    return true;
  }).length;
}

/**
 * Extract behavioural features from trip readings and alerts.
 * @param {Object} params
 * @param {Array} params.readings - GPS rows with speed_kmh, distance_m, recorded_at
 * @param {Array} params.alerts - alert rows with type, severity
 * @param {number|null} params.speedLimitKmh
 * @param {string|Date|null} params.startedAt
 * @param {string|Date|null} params.endedAt
 * @returns {TripFeatures}
 */
export function extractTripFeatures({
  readings,
  alerts,
  speedLimitKmh,
  startedAt,
  endedAt,
}) {
  const limit = Number.isFinite(Number(speedLimitKmh)) && Number(speedLimitKmh) > 0
    ? Number(speedLimitKmh)
    : null;

  const speeds = readings
    .map((r) => (r.speed_kmh == null ? null : Number(r.speed_kmh)))
    .filter((s) => s != null && Number.isFinite(s));

  const averageSpeedKmh = speeds.length
    ? Number((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2))
    : null;

  const maximumSpeedKmh = speeds.length ? Math.max(...speeds) : null;

  const maximumSpeedRatio =
    limit && maximumSpeedKmh != null
      ? Number((maximumSpeedKmh / limit).toFixed(3))
      : null;

  let overspeedCount = 0;
  let criticalOverspeedCount = 0;

  if (limit) {
    const criticalThreshold = limit * 1.2;
    for (const speed of speeds) {
      if (speed > criticalThreshold) criticalOverspeedCount += 1;
      else if (speed > limit) overspeedCount += 1;
    }
  }

  const restrictedZoneViolations = countAlertsByType(alerts, 'restricted_zone');
  const outOfHoursViolations = countAlertsByType(alerts, 'out_of_hours');
  const routeDeviationViolations = countAlertsByType(alerts, 'route_deviation');

  const overspeedAlerts = countAlertsByType(alerts, 'overspeed', 'warning');
  const criticalOverspeedAlerts = countAlertsByType(alerts, 'overspeed', 'critical');

  const distanceTravelledM = readings.reduce(
    (sum, r) => sum + (Number(r.distance_m) || 0),
    0,
  );

  let tripDurationSeconds = null;
  if (startedAt && endedAt) {
    const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (Number.isFinite(ms) && ms >= 0) {
      tripDurationSeconds = Math.round(ms / 1000);
    }
  }

  return {
    averageSpeedKmh,
    maximumSpeedKmh,
    speedLimitKmh: limit,
    maximumSpeedRatio,
    overspeedCount,
    criticalOverspeedCount,
    restrictedZoneViolations,
    outOfHoursViolations,
    routeDeviationViolations,
    totalAlertCount: alerts.length,
    tripDurationSeconds,
    readingCount: readings.length,
    distanceTravelledM: Number(distanceTravelledM.toFixed(2)),
    // Alert-based event counts used by the risk model (deduplicated rule events)
    overspeedAlertCount: overspeedAlerts,
    criticalOverspeedAlertCount: criticalOverspeedAlerts,
  };
}
