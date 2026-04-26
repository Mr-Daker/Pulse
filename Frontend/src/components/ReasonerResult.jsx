import Badge from "./Badge";

export default function ReasonerResult({ result }) {
  return (
    <article className={`reasoner-card reasoner-${result.tone}`}>
      <div className="reasoner-head">
        <h3>Medical Bias Reasoner</h3>
        <Badge tone={result.tone}>{result.classification}</Badge>
      </div>
      <p>{result.reasoning}</p>
      <div className="recommendation-box">
        <strong>Recommendation</strong>
        <p>{result.recommendation}</p>
      </div>
    </article>
  );
}
