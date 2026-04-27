import { useState } from "react";
import Shell from "../components/Shell";
import Badge from "../components/Badge";
import MetricCard from "../components/MetricCard";
import BarChart from "../components/BarChart";
import Heatmap from "../components/Heatmap";
import PatientTable from "../components/PatientTable";
import TemporalDriftChart from "../components/TemporalDriftChart";
import { AdminPanel, BuilderPanel, DoctorPanel } from "../components/RolePanels";
import { models, patientRows } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

export default function AnalyzePage() {
  const { selectedModel, setSelectedModel, selectedLanguage, setSelectedLanguage } = useAppContext();
  const [activeRole, setActiveRole] = useState("doctor");
  const [livePatient, setLivePatient] = useState({
    age: 67,
    gender: "Female",
    district_type: "Remote",
    insurance_type: "PMJAY",
  });
  const [liveAudit, setLiveAudit] = useState(null);
  const [liveAuditLoading, setLiveAuditLoading] = useState(false);
  const model = models[selectedModel];

  const runLiveAudit = async (event) => {
    event.preventDefault();
    setLiveAuditLoading(true);
    setLiveAudit(null);

    const patient_record = {
      patient_id: "LIVE-001",
      age: Number(livePatient.age),
      age_group: Number(livePatient.age) >= 60 ? "60+" : "30-45",
      gender: livePatient.gender,
      district_type: livePatient.district_type,
      insurance_type: livePatient.insurance_type,
      vitals: { hr: 118, sbp: 94, dbp: 62, temp: 38.9, rr: 24, spo2: 94 },
      labs: { wbc: 14.2, lactate: 2.8, creatinine: 1.3, platelets: 142 },
      symptoms: { pain_score: 7, onset_hours: 6, altered_mental_status: false },
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/analyze/counterfactual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_record, model_id: selectedModel }),
      });

      if (!response.ok) {
        throw new Error("Counterfactual request failed");
      }

      const data = await response.json();
      setLiveAudit(data.results || data.counterfactuals || data);
    } catch {
      setLiveAudit({
        baseline: model.counterfactual.baselineScore,
        cards: model.counterfactual.cards,
        fallback: true,
      });
    } finally {
      setLiveAuditLoading(false);
    }
  };

  const roleActions = (
    <>
      <button
        className="button button-secondary"
        onClick={() => setSelectedModel(selectedModel === "biased" ? "fair" : "biased")}
      >
        Switch Model
      </button>
      <Badge tone={model.verdictTone}>{model.verdict}</Badge>
    </>
  );

  return (
    <Shell
      currentStep="Step 3 of 3 - Audit Results"
      title="Analysis Dashboard"
      subtitle={`${model.shortName} audit results across clinician, builder, and governance views.`}
      actions={roleActions}
    >
      {model.verdictTone === "danger" ? (
        <div className="bias-banner">
          <strong>BIAS DETECTED</strong>
          <span>This model shows statistically significant and clinically unjustified disparity across demographic groups.</span>
        </div>
      ) : null}

      <div className="role-tabs">
        {[
          ["doctor", "Doctor View"],
          ["builder", "Builder View"],
          ["admin", "Administrator View"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab-button ${activeRole === key ? "tab-button-active" : ""}`}
            onClick={() => setActiveRole(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeRole === "doctor" ? (
        <DoctorPanel
          data={model.doctorView}
          language={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
      ) : null}
      {activeRole === "builder" ? <BuilderPanel data={model.builderView} /> : null}
      {activeRole === "admin" ? (
        <>
          <AdminPanel data={model.adminView} />
          <TemporalDriftChart data={model.drift} />
        </>
      ) : null}

      <section className="dashboard-grid">
        <div className="metrics-column">
          <div className="metric-stack">
            {model.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
          <BarChart items={model.barChart} />
        </div>
        <div className="heatmap-column">
          <Heatmap heatmap={model.heatmap} />
        </div>
      </section>

      <PatientTable rows={patientRows} modelId={model.id} />

      <section className="content-card live-audit-card">
        <div className="section-heading">
          <h3>Live Patient Audit</h3>
          <p>Scenario C: enter a patient profile and run counterfactuals against the selected model.</p>
        </div>
        <form className="live-audit-form" onSubmit={runLiveAudit}>
          <label>
            Age
            <input
              type="number"
              min="1"
              value={livePatient.age}
              onChange={(event) => setLivePatient({ ...livePatient, age: event.target.value })}
            />
          </label>
          <label>
            Gender
            <select
              value={livePatient.gender}
              onChange={(event) => setLivePatient({ ...livePatient, gender: event.target.value })}
            >
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            District
            <select
              value={livePatient.district_type}
              onChange={(event) => setLivePatient({ ...livePatient, district_type: event.target.value })}
            >
              <option>Remote</option>
              <option>Rural</option>
              <option>Urban</option>
            </select>
          </label>
          <label>
            Insurance
            <select
              value={livePatient.insurance_type}
              onChange={(event) => setLivePatient({ ...livePatient, insurance_type: event.target.value })}
            >
              <option>PMJAY</option>
              <option>State</option>
              <option>Private</option>
              <option>None</option>
            </select>
          </label>
          <button className="button" type="submit" disabled={liveAuditLoading}>
            {liveAuditLoading ? "Running..." : "Run Live Audit"}
          </button>
        </form>
        {liveAudit ? (
          <div className="live-audit-results">
            {"cards" in liveAudit ? (
              liveAudit.cards.map((card) => <CounterfactualPreview key={card.title} card={card} />)
            ) : (
              <pre>{JSON.stringify(liveAudit, null, 2)}</pre>
            )}
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function CounterfactualPreview({ card }) {
  return (
    <article className="live-audit-result">
      <strong>{card.score} / 100</strong>
      <span>{card.profile}</span>
      <em>{card.delta}</em>
    </article>
  );
}
