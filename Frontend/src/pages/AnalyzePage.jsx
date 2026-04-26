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
  const model = models[selectedModel];

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
    </Shell>
  );
}
