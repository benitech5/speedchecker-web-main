/** Display helpers for backend-provided risk data — no scoring logic */

export function normalizeRiskLabel(raw) {
  if (raw == null || raw === '') return null;
  const value = String(raw).trim().toLowerCase();
  if (value === 'low') return 'low';
  if (value === 'medium' || value === 'med') return 'medium';
  if (value === 'high') return 'high';
  return value;
}

export function riskLabelText(label) {
  const normalized = normalizeRiskLabel(label);
  if (!normalized) return null;
  return normalized.toUpperCase();
}

export function normalizeRiskFactors(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item.message === 'string') return item.message;
      if (item && typeof item.factor === 'string') return item.factor;
      return null;
    })
    .filter(Boolean);
}

export function normalizeWeeklySummary(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const alertsByType = raw.alertsByType || raw.alertsByCategory || {};
  const topRiskyVehicles = Array.isArray(raw.topRiskyVehicles)
    ? raw.topRiskyVehicles
    : Array.isArray(raw.highestRiskVehicles)
      ? raw.highestRiskVehicles
      : [];

  const top = raw.topRiskVehicle
    || topRiskyVehicles[0]
    || null;

  return {
    weekStart: raw.weekStart || raw.from || null,
    weekEnd: raw.weekEnd || raw.to || null,
    totalTrips: raw.totalTrips ?? null,
    completedTrips: raw.completedTrips ?? null,
    activeTrips: raw.activeTrips ?? null,
    totalAlerts: raw.totalAlerts ?? null,
    criticalAlerts: raw.criticalAlerts ?? raw.alertsBySeverity?.critical ?? null,
    warningAlerts: raw.warningAlerts ?? raw.alertsBySeverity?.warning ?? null,
    activeVehicles: raw.activeVehicles ?? null,
    avgRiskScore: raw.avgRiskScore ?? null,
    lowRiskTrips: raw.lowRiskTrips ?? null,
    mediumRiskTrips: raw.mediumRiskTrips ?? null,
    highRiskTrips: raw.highRiskTrips ?? null,
    alertsByType,
    topRiskVehicle: top
      ? {
          plateNumber: top.plateNumber || top.vehicle || '—',
          riskScore: top.riskScore ?? null,
          riskLabel: normalizeRiskLabel(top.riskLabel || top.riskLevel),
          alertCount: top.alertCount ?? null,
        }
      : null,
    topRiskyVehicles: topRiskyVehicles.map((v) => ({
      plateNumber: v.plateNumber || v.vehicle || '—',
      riskScore: v.riskScore ?? null,
      riskLabel: normalizeRiskLabel(v.riskLabel || v.riskLevel),
      alertCount: v.alertCount ?? null,
    })),
    topRiskyDrivers: Array.isArray(raw.topRiskyDrivers)
      ? raw.topRiskyDrivers.map((d) => ({
          name: d.name || '—',
          riskScore: d.riskScore ?? null,
          riskLabel: normalizeRiskLabel(d.riskLabel || d.riskLevel),
          alertCount: d.alertCount ?? null,
          tripCount: d.tripCount ?? null,
        }))
      : [],
  };
}
