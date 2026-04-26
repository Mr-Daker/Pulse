import Badge from "./Badge";

export default function MetricCard({ metric }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <p>{metric.label}</p>
        <Badge tone={metric.tone}>{metric.status}</Badge>
      </div>
      <h3>{metric.value.toFixed(2)}</h3>
      <p>{metric.detail}</p>
    </article>
  );
}
