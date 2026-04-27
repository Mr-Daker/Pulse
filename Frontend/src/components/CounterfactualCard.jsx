export default function CounterfactualCard({ card }) {
  const deltaValue = Math.abs(Number.parseInt(card.delta, 10) || 0);
  const deltaClassName = deltaValue > 10 ? "counter-delta-danger" : "counter-delta-muted";

  return (
    <article className="counter-card">
      <p className="counter-label">{card.title}</p>
      <h3>{card.score} / 100</h3>
      <p>{card.profile}</p>
      <strong className={deltaClassName}>{card.delta}</strong>
    </article>
  );
}
