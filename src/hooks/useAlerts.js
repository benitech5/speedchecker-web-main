import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { ALERT_POLL_INTERVAL_MS, normalizeAlert } from '../utils/alerts.js';

export function useAlerts({ enablePolling = true } = {}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ackError, setAckError] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const mountedRef = useRef(true);

  const fetchAlerts = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      /* keep prior list visible during poll refreshes */
    }
    try {
      const data = await api.getAlerts();
      if (!mountedRef.current) return;
      setAlerts(Array.isArray(data) ? data.map(normalizeAlert) : []);
      setError('');
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Unable to load alerts.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAlerts();

    if (!enablePolling) {
      return () => {
        mountedRef.current = false;
      };
    }

    const intervalId = setInterval(() => fetchAlerts({ silent: true }), ALERT_POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [enablePolling, fetchAlerts]);

  const acknowledge = useCallback(async (id) => {
    setAckError('');
    setAcknowledgingId(id);
    try {
      await api.acknowledgeAlert(id);
      if (!mountedRef.current) return;
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
      );
    } catch {
      if (!mountedRef.current) return;
      setAckError('Unable to acknowledge alert. Please try again.');
    } finally {
      if (mountedRef.current) setAcknowledgingId(null);
    }
  }, []);

  return {
    alerts,
    loading,
    error,
    ackError,
    acknowledgingId,
    acknowledge,
    refreshAlerts: fetchAlerts,
  };
}
