import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import CounterfactualCard from "../components/CounterfactualCard";
import ReasonerResult from "../components/ReasonerResult";
import CausalGraph from "../components/CausalGraph";
import { models, patientCase } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

export default function PatientPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedModel } = useAppContext();
  const [showReasoner, setShowReasoner] = useState(false);
  const [loadingReasoner, setLoadingReasoner] = useState(false);
  const model = models[selectedModel];

  const requestReasoner = () => {
    setLoadingReasoner(true);
    setShowReasoner(false);

    window.setTimeout(() => {
      setLoadingReasoner(false);
      setShowReasoner(true);
    }, 2200);
  };

  return (
    <Shell
      title={`Patient Investigation - ${id}`}
      subtitle="These variants keep clinical severity constant and change only demographics."
      actions={
        <button className="button button-secondary" onClick={() => navigate("/analyze")}>
          Back to Analysis
        </button>
      }
    >
      <section className="patient-layout">
        <article className="patient-card">
          <p className="eyebrow">Featured patient</p>
          <h2>{patientCase.name}</h2>
          <p>
            {patientCase.gender} | Age {patientCase.age} | {patientCase.district} | {patientCase.insurance}
          </p>
          <p>{patientCase.vitals}</p>
          <p>{patientCase.labs}</p>
          <div className="score-chip">
            {model.counterfactual.baselineLabel}: {model.counterfactual.baselineScore} / 100
          </div>
        </article>

        <section className="content-card">
          <div className="section-heading">
            <h3>Counterfactual Analysis</h3>
            <p>
              These three patients have identical clinical presentations. Only their
              demographic attributes differ. A fair model should assign equivalent risk
              scores to all three.
            </p>
          </div>
          <div className="counter-grid">
            {model.counterfactual.cards.map((card) => (
              <CounterfactualCard key={card.title} card={card} />
            ))}
          </div>
          <button className="button" onClick={requestReasoner} disabled={loadingReasoner}>
            {loadingReasoner ? "Analyzing..." : "Request AI Reasoning"}
          </button>
          {loadingReasoner ? (
            <div className="loading-card">
              Analyzing disparity against clinical guidelines and Indian population health literature...
            </div>
          ) : null}
          {showReasoner ? <ReasonerResult result={model.reasoner} /> : null}
        </section>
      </section>

      <CausalGraph graph={model.graph} />
    </Shell>
  );
}
