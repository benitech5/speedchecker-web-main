import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { TripTable } from '../components/VehicleTable.jsx';
import { normalizeTripSummary } from '../utils/trips.js';

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTrips()
      .then((data) => {
        const list = Array.isArray(data) ? data.map(normalizeTripSummary) : [];
        list.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
        setTrips(list);
      })
      .catch((e) => setError(e.message || 'Unable to load trips.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fleet-page">
      <header className="fleet-page-header">
        <div>
          <p className="eyebrow">HISTORY</p>
          <h1>Trip History</h1>
          <p className="fleet-muted">Recorded trips from GPS ingest</p>
        </div>
        <Link to="/simulator" className="primary-button fleet-header-btn">Open simulator</Link>
      </header>

      {loading && <p className="fleet-loading">Loading trips…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!loading && !error && (
        <section className="fleet-panel">
          <TripTable trips={trips} />
        </section>
      )}
    </div>
  );
}
