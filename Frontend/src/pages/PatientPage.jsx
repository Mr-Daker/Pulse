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
  const [liveReasoner, setLiveReasoner] = useState(null);
  const model = models[selectedModel];

  const requestReasoner = async () => {
    setLoadingReasoner(true);
    setShowReasoner(false);
    setLiveReasoner(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze/reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disparity_finding: {
            baseline_score: model.counterfactual.baselineScore,
            counterfactual_scores: model.counterfactual.cards,
            largest_delta: model.counterfactual.cards.at(-1)?.delta,
          },
          patient_context: patientCase,
          model_id: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Reasoner request failed");
      }

      const data = await response.json();
      setLiveReasoner({
        classification: data.classification || model.reasoner.classification,
        reasoning: data.reasoning || model.reasoner.reasoning,
        recommendation: data.recommendation || model.reasoner.recommendation,
        tone: data.classification === "STRUCTURALLY_HARMFUL" ? "danger" : model.reasoner.tone,
      });
      setShowReasoner(true);
    } catch {
      setShowReasoner(true);
    } finally {
      setLoadingReasoner(false);
    }
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
          <div className={`score-chip ${model.counterfactual.baselineScore < 50 ? "score-chip-danger" : ""}`}>
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
          <div className="counter-explainer">
            These three patients have identical clinical presentations. Only their demographic attributes differ. A fair model should assign equivalent risk scores to all three.
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
          {showReasoner ? <ReasonerResult result={liveReasoner || model.reasoner} /> : null}
        </section>
      </section>

      <CausalGraph graph={model.graph} />
    </Shell>
  );
}
