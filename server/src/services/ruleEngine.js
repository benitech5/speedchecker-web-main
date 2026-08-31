import { haversineDistanceMeters } from '../utils/haversine.js';
import { distanceToRouteMeters } from '../utils/geo.js';
import { FLEET_TIMEZONE, isMoving, isWithinWorkingHours } from '../utils/workingHours.js';

const ROUTE_DEVIATION_M = 500;
const OVERSPEED_STREAK_REQUIRED = 2;

async function getState(client, vehicleId, tripId, ruleKey) {
  const { rows } = await client.query(
    `SELECT active, streak FROM rule_states
     WHERE vehicle_id = $1 AND trip_id = $2 AND rule_key = $3`,
    [vehicleId, tripId, ruleKey],
  );
  return rows[0] || { active: false, streak: 0 };
}

async function setState(client, vehicleId, tripId, ruleKey, { active, streak }) {
  await client.query(
    `INSERT INTO rule_states (vehicle_id, trip_id, rule_key, active, streak, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (vehicle_id, trip_id, rule_key)
     DO UPDATE SET active = EXCLUDED.active, streak = EXCLUDED.streak, updated_at = NOW()`,
    [vehicleId, tripId, ruleKey, active, streak],
  );
}

async function insertAlert(client, {
  vehicleId,
  tripId,
  type,
  severity,
  message,
  latitude,
  longitude,
}) {
  const { rows } = await client.query(
    `INSERT INTO alerts
      (vehicle_id, trip_id, type, severity, message, latitude, longitude, acknowledged)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING
       id,
       vehicle_id AS "vehicleId",
       trip_id AS "tripId",
       type,
       severity,
       message,
       latitude,
       longitude,
       acknowledged,
       created_at AS "createdAt"`,
    [vehicleId, tripId, type, severity, message, latitude, longitude],
  );
  return rows[0];
}

/**
 * Evaluate fleet rules for one GPS reading. Mutates DB (alerts + rule_states).
 * Never throws for rule evaluation failures — logs and returns [].
 */
export async function evaluateRules(client, ctx) {
  const created = [];
  try {
    const {
      vehicleId,
      tripId,
      plateNumber,
      latitude,
      longitude,
      speedKmh,
      distanceM,
      speedLimitKmh,
      recordedAt,
    } = ctx;

    const limit = Number(speedLimitKmh);
    const speed = speedKmh == null ? null : Number(speedKmh);
    const label = plateNumber || vehicleId;

    // --- Overspeed (warning: 2 consecutive; critical: immediate) ---
    if (Number.isFinite(limit) && limit > 0 && speed != null && Number.isFinite(speed)) {
      const criticalThreshold = limit * 1.2;
      const isCritical = speed > criticalThreshold;
      const isOver = speed > limit;

      const warnKey = 'overspeed_warning';
      const critKey = 'overspeed_critical';
      const warnState = await getState(client, vehicleId, tripId, warnKey);
      const critState = await getState(client, vehicleId, tripId, critKey);

      if (isCritical) {
        if (!critState.active) {
          const alert = await insertAlert(client, {
            vehicleId,
            tripId,
            type: 'overspeed',
            severity: 'critical',
            message: `${label} critical overspeed: ${speed.toFixed(1)} km/h (limit ${limit} km/h, threshold ${(criticalThreshold).toFixed(0)} km/h)`,
            latitude,
            longitude,
          });
          created.push(alert);
          await setState(client, vehicleId, tripId, critKey, { active: true, streak: 1 });
        } else {
          await setState(client, vehicleId, tripId, critKey, { active: true, streak: critState.streak + 1 });
        }
        // Critical also counts as overspeed streak for warning state, but don't dual-fire warning on same event if warning already active
        if (!warnState.active) {
          // Mark warning event as active too so we don't also fire a duplicate warning for the same continuous exceedance
          await setState(client, vehicleId, tripId, warnKey, { active: true, streak: OVERSPEED_STREAK_REQUIRED });
        } else {
          await setState(client, vehicleId, tripId, warnKey, { active: true, streak: warnState.streak + 1 });
        }
      } else if (isOver) {
        if (critState.active) {
          await setState(client, vehicleId, tripId, critKey, { active: false, streak: 0 });
        }

        if (warnState.active) {
          await setState(client, vehicleId, tripId, warnKey, {
            active: true,
            streak: warnState.streak + 1,
          });
        } else {
          const nextStreak = warnState.streak + 1;
          if (nextStreak >= OVERSPEED_STREAK_REQUIRED) {
            const alert = await insertAlert(client, {
              vehicleId,
              tripId,
              type: 'overspeed',
              severity: 'warning',
              message: `${label} overspeed: ${speed.toFixed(1)} km/h exceeded limit of ${limit} km/h`,
              latitude,
              longitude,
            });
            created.push(alert);
            await setState(client, vehicleId, tripId, warnKey, { active: true, streak: nextStreak });
          } else {
            await setState(client, vehicleId, tripId, warnKey, { active: false, streak: nextStreak });
          }
        }
      } else {
        // Back at/below limit — reset both
        if (warnState.active || warnState.streak > 0) {
          await setState(client, vehicleId, tripId, warnKey, { active: false, streak: 0 });
        }
        if (critState.active || critState.streak > 0) {
          await setState(client, vehicleId, tripId, critKey, { active: false, streak: 0 });
        }
      }
    }

    // --- Restricted geofences ---
    const geoRes = await client.query(
      `SELECT id, name, center_lat, center_lng, radius_m
       FROM geofences WHERE type = 'restricted'`,
    );
    for (const g of geoRes.rows) {
      const dist = haversineDistanceMeters(latitude, longitude, g.center_lat, g.center_lng);
      const inside = dist <= g.radius_m;
      const key = `restricted:${g.id}`;
      const state = await getState(client, vehicleId, tripId, key);
      if (inside) {
        if (!state.active) {
          const alert = await insertAlert(client, {
            vehicleId,
            tripId,
            type: 'restricted_zone',
            severity: 'critical',
            message: `${label} entered restricted zone "${g.name}"`,
            latitude,
            longitude,
          });
          created.push(alert);
          await setState(client, vehicleId, tripId, key, { active: true, streak: 1 });
        }
      } else if (state.active) {
        await setState(client, vehicleId, tripId, key, { active: false, streak: 0 });
      }
    }

    // --- Out of hours (Africa/Accra = GMT) ---
    const oohKey = 'out_of_hours';
    const oohState = await getState(client, vehicleId, tripId, oohKey);
    const outsideHours = !isWithinWorkingHours(recordedAt, FLEET_TIMEZONE);
    const moving = isMoving(speed, distanceM);
    if (outsideHours && moving) {
      if (!oohState.active) {
        const alert = await insertAlert(client, {
          vehicleId,
          tripId,
          type: 'out_of_hours',
          severity: 'warning',
          message: `${label} driving outside approved hours (Mon–Fri 08:00–18:00 GMT / ${FLEET_TIMEZONE})`,
          latitude,
          longitude,
        });
        created.push(alert);
        await setState(client, vehicleId, tripId, oohKey, { active: true, streak: 1 });
      }
    } else if (oohState.active && (!outsideHours || !moving)) {
      if (!outsideHours) {
        await setState(client, vehicleId, tripId, oohKey, { active: false, streak: 0 });
      }
    }

    // --- Route deviation ---
    const routeRes = await client.query(
      `SELECT id, name, waypoints FROM planned_routes ORDER BY created_at ASC LIMIT 1`,
    );
    if (routeRes.rowCount > 0) {
      const route = routeRes.rows[0];
      let waypoints = route.waypoints;
      if (typeof waypoints === 'string') {
        try {
          waypoints = JSON.parse(waypoints);
        } catch {
          waypoints = [];
        }
      }
      const distRoute = distanceToRouteMeters(latitude, longitude, waypoints);
      const devKey = 'route_deviation';
      const devState = await getState(client, vehicleId, tripId, devKey);
      if (distRoute != null && distRoute > ROUTE_DEVIATION_M) {
        if (!devState.active) {
          const alert = await insertAlert(client, {
            vehicleId,
            tripId,
            type: 'route_deviation',
            severity: 'warning',
            message: `${label} route deviation: ${distRoute.toFixed(0)} m from "${route.name}" (limit ${ROUTE_DEVIATION_M} m)`,
            latitude,
            longitude,
          });
          created.push(alert);
          await setState(client, vehicleId, tripId, devKey, { active: true, streak: 1 });
        }
      } else if (devState.active) {
        await setState(client, vehicleId, tripId, devKey, { active: false, streak: 0 });
      }
    }
  } catch (err) {
    console.error('Rule evaluation error:', err.message);
  }
  return created;
}

export { FLEET_TIMEZONE };
