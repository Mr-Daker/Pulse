export default function CounterfactualCard({ card }) {
  return (
    <article className="counter-card">
      <p className="counter-label">{card.title}</p>
      <h3>{card.score} / 100</h3>
      <p>{card.profile}</p>
      <strong>{card.delta}</strong>
    </article>
  );
}
