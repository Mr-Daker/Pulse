import { useState } from "react";
import Shell from "../components/Shell";
import Badge from "../components/Badge";
import { reportSections } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

export default function ReportPage() {
  const { selectedModel, selectedLanguage } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = () => {
    setLoading(true);
    setGenerated(false);

    window.setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 3200);
  };

  return (
    <Shell
      title="Audit Report"
      subtitle="Governance-ready summary of the current audit state."
      actions={<Badge tone={selectedModel === "biased" ? "danger" : "success"}>{selectedModel === "biased" ? "BIAS DETECTED" : "FAIR"}</Badge>}
    >
      <div className="report-actions">
        <button className="button" onClick={generateReport} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
        {generated ? (
          <>
            <button className="button button-secondary" onClick={() => window.print()}>
              Download PDF
            </button>
            {selectedLanguage === "ta" ? (
              <button className="button button-secondary">Download in Tamil</button>
            ) : null}
          </>
        ) : null}
      </div>

      {loading ? <div className="loading-card">Writing a structured audit report for hospital governance review...</div> : null}

      {generated ? (
        <section className="report-card">
          <header className="report-header">
            <div>
              <p className="eyebrow">PULSE Audit Output</p>
              <h2>Medical AI Bias Audit Report</h2>
            </div>
            <div>
              <p>Model audited: {selectedModel === "biased" ? "Model B" : "Model A"}</p>
              <p>Date: 27 April 2026</p>
              <p>PULSE version: Demo Sprint</p>
            </div>
          </header>
          {reportSections.map((section) => (
            <article className="report-section" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </section>
      ) : null}
    </Shell>
  );
}
