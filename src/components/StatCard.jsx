export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}
