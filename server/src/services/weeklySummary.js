import { pool } from '../db/pool.js';
import { classifyRiskLabel } from './riskModel.js';

/**
 * Week bounds (Monday 00:00 UTC — Sunday 23:59:59.999 UTC).
 * Ghana (Africa/Accra) has no DST; fleet timestamps use UTC in tests/simulator.
 */
export function getWeekBounds(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setUTCHours(0, 0, 0, 0);

  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(d);
  weekStart.setUTCDate(d.getUTCDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
    weekStartIso: weekStart.toISOString(),
    weekEndIso: weekEnd.toISOString(),
  };
}

function riskLabelFromScore(avgScore) {
  if (avgScore == null || !Number.isFinite(Number(avgScore))) return null;
  return classifyRiskLabel(Number(avgScore));
}

/**
 * Weekly fleet summary from database (no hard-coded values).
 * @param {string|null} weekParam - ISO date within the target week (YYYY-MM-DD)
 */
export async function getWeeklySummary(weekParam = null) {
  const ref = weekParam ? new Date(`${weekParam}T12:00:00.000Z`) : new Date();
  const { weekStart, weekEnd, weekStartIso, weekEndIso } = getWeekBounds(ref);

  const tripStats = await pool.query(
    `SELECT
       COUNT(*)::int AS total_trips,
       COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_trips,
       COUNT(*) FILTER (WHERE status = 'active')::int AS active_trips,
       ROUND(AVG(risk_score) FILTER (WHERE status = 'completed' AND risk_score IS NOT NULL))::int AS avg_risk_score,
       COUNT(*) FILTER (WHERE risk_label = 'low')::int AS low_risk_trips,
       COUNT(*) FILTER (WHERE risk_label = 'medium')::int AS medium_risk_trips,
       COUNT(*) FILTER (WHERE risk_label = 'high')::int AS high_risk_trips
     FROM trips
     WHERE started_at >= $1 AND started_at < $2`,
    [weekStartIso, weekEndIso],
  );

  const alertStats = await pool.query(
    `SELECT
       COUNT(*)::int AS total_alerts,
       COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical_alerts,
       COUNT(*) FILTER (WHERE severity = 'warning')::int AS warning_alerts
     FROM alerts
     WHERE created_at >= $1 AND created_at < $2`,
    [weekStartIso, weekEndIso],
  );

  const alertsByTypeRes = await pool.query(
    `SELECT type, COUNT(*)::int AS count
     FROM alerts
     WHERE created_at >= $1 AND created_at < $2
     GROUP BY type
     ORDER BY count DESC`,
    [weekStartIso, weekEndIso],
  );

  const alertsBySeverityRes = await pool.query(
    `SELECT severity, COUNT(*)::int AS count
     FROM alerts
     WHERE created_at >= $1 AND created_at < $2
     GROUP BY severity`,
    [weekStartIso, weekEndIso],
  );

  const activeVehiclesRes = await pool.query(
    `SELECT COUNT(DISTINCT vehicle_id)::int AS active_vehicles
     FROM trips
     WHERE status = 'active'`,
  );

  const topVehiclesRes = await pool.query(
    `SELECT
       v.plate_number,
       COUNT(t.id)::int AS trip_count,
       ROUND(AVG(t.risk_score))::int AS avg_risk_score,
       MAX(t.risk_score)::int AS highest_risk_score,
       COUNT(a.id)::int AS alert_count
     FROM trips t
     JOIN vehicles v ON v.id = t.vehicle_id
     LEFT JOIN alerts a ON a.trip_id = t.id
     WHERE t.status = 'completed'
       AND t.risk_score IS NOT NULL
       AND t.started_at >= $1 AND t.started_at < $2
     GROUP BY v.id, v.plate_number
     ORDER BY avg_risk_score DESC NULLS LAST, highest_risk_score DESC
     LIMIT 10`,
    [weekStartIso, weekEndIso],
  );

  const topDriversRes = await pool.query(
    `SELECT
       d.name,
       COUNT(t.id)::int AS trip_count,
       ROUND(AVG(t.risk_score))::int AS avg_risk_score,
       MAX(t.risk_score)::int AS highest_risk_score,
       COUNT(a.id)::int AS alert_count
     FROM trips t
     JOIN drivers d ON d.id = t.driver_id
     LEFT JOIN alerts a ON a.trip_id = t.id
     WHERE t.status = 'completed'
       AND t.risk_score IS NOT NULL
       AND t.driver_id IS NOT NULL
       AND t.started_at >= $1 AND t.started_at < $2
     GROUP BY d.id, d.name
     ORDER BY avg_risk_score DESC NULLS LAST, highest_risk_score DESC
     LIMIT 10`,
    [weekStartIso, weekEndIso],
  );

  const ts = tripStats.rows[0];
  const as = alertStats.rows[0];

  const alertsByType = {};
  for (const row of alertsByTypeRes.rows) {
    alertsByType[row.type] = row.count;
  }

  const alertsBySeverity = {};
  for (const row of alertsBySeverityRes.rows) {
    alertsBySeverity[row.severity] = row.count;
  }

  const topRiskyVehicles = topVehiclesRes.rows.map((v) => ({
    plateNumber: v.plate_number,
    tripCount: v.trip_count,
    riskScore: v.avg_risk_score,
    highestRiskScore: v.highest_risk_score,
    riskLabel: riskLabelFromScore(v.avg_risk_score),
    alertCount: v.alert_count,
  }));

  const topRiskyDrivers = topDriversRes.rows.map((d) => ({
    name: d.name,
    tripCount: d.trip_count,
    riskScore: d.avg_risk_score,
    highestRiskScore: d.highest_risk_score,
    riskLabel: riskLabelFromScore(d.avg_risk_score),
    alertCount: d.alert_count,
  }));

  return {
    weekStart,
    weekEnd,
    totalTrips: ts.total_trips,
    completedTrips: ts.completed_trips,
    activeTrips: ts.active_trips,
    totalAlerts: as.total_alerts,
    criticalAlerts: as.critical_alerts,
    warningAlerts: as.warning_alerts,
    alertsByType,
    alertsBySeverity,
    activeVehicles: activeVehiclesRes.rows[0]?.active_vehicles ?? 0,
    avgRiskScore: ts.avg_risk_score,
    lowRiskTrips: ts.low_risk_trips,
    mediumRiskTrips: ts.medium_risk_trips,
    highRiskTrips: ts.high_risk_trips,
    topRiskVehicle: topRiskyVehicles[0] || null,
    topRiskyVehicles,
    topRiskyDrivers,
  };
}
