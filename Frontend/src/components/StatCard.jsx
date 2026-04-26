export default function StatCard({ value, label, detail }) {
  return (
    <article className="stat-card">
      <p className="stat-value">{value}</p>
      <h3>{label}</h3>
      <p>{detail}</p>
    </article>
  );
}
