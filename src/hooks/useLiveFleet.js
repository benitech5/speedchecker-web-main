import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { LIVE_POLL_INTERVAL_MS, normalizeLiveVehicle } from '../utils/liveVehicle.js';

export function useLiveFleet({ enablePolling = true } = {}) {
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [geofencesLoading, setGeofencesLoading] = useState(true);
  const [liveError, setLiveError] = useState('');
  const [geofenceError, setGeofenceError] = useState('');
  const mountedRef = useRef(true);

  const fetchLive = useCallback(async () => {
    try {
      const data = await api.getLiveVehicles();
      if (!mountedRef.current) return;
      setVehicles(Array.isArray(data) ? data.map(normalizeLiveVehicle) : []);
      setLiveError('');
    } catch (err) {
      if (!mountedRef.current) return;
      setLiveError(err.message || 'Unable to load live vehicle data.');
    } finally {
      if (mountedRef.current) setLiveLoading(false);
    }
  }, []);

  const fetchGeofences = useCallback(async () => {
    try {
      const data = await api.getGeofences();
      if (!mountedRef.current) return;
      setGeofences(Array.isArray(data) ? data : []);
      setGeofenceError('');
    } catch (err) {
      if (!mountedRef.current) return;
      setGeofenceError(err.message || 'Unable to load geofences.');
    } finally {
      if (mountedRef.current) setGeofencesLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchGeofences();
    fetchLive();

    if (!enablePolling) {
      return () => {
        mountedRef.current = false;
      };
    }

    const intervalId = setInterval(fetchLive, LIVE_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [enablePolling, fetchLive, fetchGeofences]);

  return {
    vehicles,
    geofences,
    liveLoading,
    geofencesLoading,
    liveError,
    geofenceError,
    refreshLive: fetchLive,
  };
}
