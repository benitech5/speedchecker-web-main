import RiskBadge from './RiskBadge.jsx';

export default function TripRiskPanel({ trip }) {
  const hasScore = trip.riskScore != null;
  const hasLabel = Boolean(trip.riskLabel);
  const factors = trip.riskFactors || [];

  if (!hasScore && !hasLabel) {
    if (trip.status === 'active' || !trip.endedAt) {
      return (
        <section className="fleet-panel trip-risk-panel">
          <h2>AI Risk Assessment</h2>
          <p className="fleet-muted">Risk score is assigned when the trip ends.</p>
        </section>
      );
    }
    return (
      <section className="fleet-panel trip-risk-panel">
        <h2>AI Risk Assessment</h2>
        <p className="fleet-muted">No risk classification returned for this trip.</p>
      </section>
    );
  }

  return (
    <section className="fleet-panel trip-risk-panel">
      <div className="fleet-panel-head">
        <h2>AI Risk Assessment</h2>
        <RiskBadge label={trip.riskLabel} score={trip.riskScore} />
      </div>

      <div className="trip-risk-score-row">
        {hasScore && (
          <div>
            <p>Risk score</p>
            <strong>{trip.riskScore} <small>/ 100</small></strong>
          </div>
        )}
        {hasLabel && (
          <div>
            <p>Risk level</p>
            <strong><RiskBadge label={trip.riskLabel} /></strong>
          </div>
        )}
      </div>

      {factors.length > 0 ? (
        <div className="risk-factors">
          <p className="eyebrow">RISK FACTORS</p>
          <ul>
            {factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="fleet-muted">Risk classification generated from trip behaviour.</p>
      )}
    </section>
  );
}
