/** Out-of-hours timezone: Ghana uses GMT year-round (no DST). */
export const FLEET_TIMEZONE = 'Africa/Accra';

const WEEKDAY_SHORT = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 0,
};

/**
 * Returns true if timestamp falls in Mon–Fri 08:00–18:00 Africa/Accra (GMT).
 */
export function isWithinWorkingHours(date, timeZone = FLEET_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekday = WEEKDAY_SHORT[map.weekday];
  if (weekday === undefined || weekday === 0 || weekday === 6) {
    return false; // weekend
  }

  const hour = Number(map.hour);
  const minute = Number(map.minute);
  const mins = hour * 60 + minute;
  // 08:00 inclusive → 18:00 exclusive
  return mins >= 8 * 60 && mins < 18 * 60;
}

/** Vehicle considered moving if speed > 0 or segment distance > 1 m. */
export function isMoving(speedKmh, distanceM) {
  if (Number.isFinite(speedKmh) && speedKmh > 0) return true;
  if (Number.isFinite(distanceM) && distanceM > 1) return true;
  return false;
}
