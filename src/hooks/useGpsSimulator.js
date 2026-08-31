import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { ROUTE_MODES, SIMULATION_INTERVAL_MS } from '../data/simulatorRoutes.js';

function formatPoint(point) {
  if (!point) return '—';
  return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
}

function formatResponse(data) {
  if (!data) return '—';
  const parts = [`tripId: ${data.tripId ?? '—'}`];
  if (data.speedKmh != null) parts.push(`speed: ${Number(data.speedKmh).toFixed(1)} km/h`);
  if (Array.isArray(data.alerts) && data.alerts.length) {
    parts.push(`alerts: ${data.alerts.length}`);
  }
  return parts.join(' · ');
}

function formatEndTripResponse(data) {
  const parts = ['Trip ended'];
  if (data.riskScore != null) parts.push(`risk ${data.riskScore}`);
  if (data.riskLabel) parts.push(data.riskLabel.toUpperCase());
  return parts.join(' · ');
}

export function useGpsSimulator() {
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [routeMode, setRouteMode] = useState('normal');
  const [simStatus, setSimStatus] = useState('Idle');
  const [pointsSent, setPointsSent] = useState(0);
  const [pointIndex, setPointIndex] = useState(0);
  const [lastPoint, setLastPoint] = useState(null);
  const [lastResponse, setLastResponse] = useState('—');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [endingTrip, setEndingTrip] = useState(false);

  const timerRef = useRef(null);
  const stoppedRef = useRef(false);
  const pointIndexRef = useRef(0);
  const routeModeRef = useRef(routeMode);
  const vehicleIdRef = useRef(vehicleId);
  const simTimeRef = useRef(null);

  useEffect(() => {
    routeModeRef.current = routeMode;
  }, [routeMode]);

  useEffect(() => {
    vehicleIdRef.current = vehicleId;
  }, [vehicleId]);

  useEffect(() => {
    pointIndexRef.current = pointIndex;
  }, [pointIndex]);

  useEffect(() => {
    api.getVehicles()
      .then((list) => {
        setVehicles(list);
        if (list.length) setVehicleId(list[0].id);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load vehicles from API.');
        setVehicles([]);
      })
      .finally(() => setVehiclesLoading(false));

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRouteProgress = useCallback(() => {
    pointIndexRef.current = 0;
    simTimeRef.current = null;
    setPointIndex(0);
    setPointsSent(0);
    setLastPoint(null);
    setLastResponse('—');
    setError('');
  }, []);

  const handleRouteModeChange = useCallback((mode) => {
    stoppedRef.current = true;
    clearTimer();
    setAutoRunning(false);
    setRouteMode(mode);
    resetRouteProgress();
    setSimStatus('Idle');
  }, [clearTimer, resetRouteProgress]);

  const handleVehicleChange = useCallback((id) => {
    stoppedRef.current = true;
    clearTimer();
    setAutoRunning(false);
    setVehicleId(id);
    setActiveTripId(null);
    resetRouteProgress();
    setSimStatus('Idle');
  }, [clearTimer, resetRouteProgress]);

  const nextTimestamp = useCallback((mode, index) => {
    const config = ROUTE_MODES[mode];
    const elapsed = config?.elapsedMsPerPoint ?? 10_000;

    if (index === 0 || simTimeRef.current === null) {
      const start = config?.startTime
        ? new Date(config.startTime)
        : new Date();
      simTimeRef.current = start;
      return start.toISOString();
    }

    simTimeRef.current = new Date(simTimeRef.current.getTime() + elapsed);
    return simTimeRef.current.toISOString();
  }, []);

  const sendPointAtIndex = useCallback(async (index) => {
    const mode = routeModeRef.current;
    const config = ROUTE_MODES[mode];
    const route = config?.points;
    const vId = vehicleIdRef.current;

    if (!vId) {
      setError('Please select a vehicle.');
      return { ok: false, finished: false };
    }
    if (!route?.length) {
      setError('Please select a route mode.');
      return { ok: false, finished: false };
    }
    if (index >= route.length) {
      setError('Route completed.');
      setSimStatus('Completed');
      return { ok: false, finished: true };
    }

    const point = route[index];
    const payload = {
      vehicleId: vId,
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: nextTimestamp(mode, index),
    };

    setSending(true);
    setError('');

    try {
      const data = await api.ingestGps(payload);
      const nextIndex = index + 1;
      pointIndexRef.current = nextIndex;
      setPointIndex(nextIndex);
      setPointsSent((n) => n + 1);
      setLastPoint(point);
      setLastResponse(formatResponse(data));
      if (data.tripId) setActiveTripId(data.tripId);

      const finished = nextIndex >= route.length;
      if (finished) setSimStatus('Completed');

      return { ok: true, finished };
    } catch (err) {
      setError(err.message || 'Request failed.');
      setLastResponse('Failed');
      return { ok: false, finished: false };
    } finally {
      setSending(false);
    }
  }, [nextTimestamp]);

  const sendOnePoint = useCallback(async () => {
    stoppedRef.current = true;
    clearTimer();
    setAutoRunning(false);

    const route = ROUTE_MODES[routeModeRef.current].points;
    if (pointIndexRef.current >= route.length) {
      setError('Route completed.');
      setSimStatus('Completed');
      return;
    }

    setSimStatus('Sending');
    const result = await sendPointAtIndex(pointIndexRef.current);
    if (result.ok && !result.finished) setSimStatus('Idle');
  }, [clearTimer, sendPointAtIndex]);

  const startSimulation = useCallback(() => {
    if (autoRunning) return;
    if (!vehicleIdRef.current) {
      setError('Please select a vehicle.');
      return;
    }

    stoppedRef.current = false;
    clearTimer();
    resetRouteProgress();
    setActiveTripId(null);
    setAutoRunning(true);
    setSimStatus('Sending');

    const runNext = async () => {
      if (stoppedRef.current) {
        setAutoRunning(false);
        setSimStatus('Stopped');
        return;
      }

      const route = ROUTE_MODES[routeModeRef.current].points;
      const index = pointIndexRef.current;

      if (index >= route.length) {
        setAutoRunning(false);
        setSimStatus('Completed');
        return;
      }

      const result = await sendPointAtIndex(index);

      if (stoppedRef.current) {
        setAutoRunning(false);
        setSimStatus('Stopped');
        return;
      }

      if (!result.ok) {
        setAutoRunning(false);
        setSimStatus(result.finished ? 'Completed' : 'Stopped');
        return;
      }

      if (pointIndexRef.current >= route.length) {
        setAutoRunning(false);
        setSimStatus('Completed');
        return;
      }

      timerRef.current = setTimeout(runNext, SIMULATION_INTERVAL_MS);
    };

    runNext();
  }, [autoRunning, clearTimer, resetRouteProgress, sendPointAtIndex]);

  const stopSimulation = useCallback(() => {
    stoppedRef.current = true;
    clearTimer();
    setAutoRunning(false);
    setSimStatus('Stopped');
  }, [clearTimer]);

  const endTrip = useCallback(async () => {
    if (!activeTripId) {
      setError('No active trip to end. Send GPS points first.');
      return;
    }

    stoppedRef.current = true;
    clearTimer();
    setAutoRunning(false);
    setEndingTrip(true);
    setError('');

    try {
      const data = await api.endTrip(activeTripId);
      setLastResponse(formatEndTripResponse(data));
      setSimStatus('Idle');
      setActiveTripId(null);
      resetRouteProgress();
    } catch (err) {
      setError(err.message || 'Unable to end trip.');
      setLastResponse('End trip failed');
    } finally {
      setEndingTrip(false);
    }
  }, [activeTripId, clearTimer, resetRouteProgress]);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const routeConfig = ROUTE_MODES[routeMode];
  const routeLabel = routeConfig?.label ?? '—';
  const routeComplete = pointIndex >= (routeConfig?.points.length ?? 0);

  return {
    vehicles,
    vehiclesLoading,
    vehicleId,
    routeMode,
    simStatus,
    pointsSent,
    lastPoint,
    lastResponse,
    error,
    sending,
    autoRunning,
    endingTrip,
    activeTripId,
    selectedVehicle,
    routeLabel,
    routeDescription: routeConfig?.description ?? '',
    routeComplete,
    handleVehicleChange,
    handleRouteModeChange,
    sendOnePoint,
    startSimulation,
    stopSimulation,
    endTrip,
    formatPoint,
  };
}
