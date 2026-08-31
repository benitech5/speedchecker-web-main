import { riskLabelText, normalizeRiskLabel } from '../utils/risk.js';

export default function RiskBadge({ label, score = null, size = 'md' }) {
  const normalized = normalizeRiskLabel(label);
  if (!normalized) {
    return <span className="fleet-muted">—</span>;
  }

  const text = riskLabelText(normalized);
  return (
    <span className={`risk-badge risk-${normalized} risk-size-${size}`} title={score != null ? `Score ${score}` : undefined}>
      {text}
      {score != null && size !== 'sm' && <em> {score}</em>}
    </span>
  );
}
