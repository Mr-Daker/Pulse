import { useState } from "react";
import Shell from "../components/Shell";
import Badge from "../components/Badge";
import { reportSections } from "../data/demoData";
import { useAppContext } from "../context/AppContext";

const fairReportSections = [
  {
    title: "Executive Summary",
    body:
      "PULSE audited Model A for sepsis risk scoring and found no clinically unjustified demographic disparity in the sampled counterfactual analysis. The overall verdict is FAIR.",
  },
  {
    title: "Bias Findings",
    body:
      "Demographic Parity Gap: 0.04. Equalized Odds Gap: 0.03. Calibration Gap: 0.02. Patient-level counterfactuals remained within acceptable variance for equivalent clinical presentations.",
  },
  {
    title: "Affected Populations",
    body:
      "No highest-risk demographic group was identified for fairness escalation in this audit. Remote, rural, and urban cohorts received comparable risk scores for equivalent clinical severity.",
  },
  {
    title: "Recommendations",
    body:
      "Keep Model A in approved decision-support status. Continue routine fairness monitoring as new district data and additional hospital sites are onboarded.",
  },
  {
    title: "Methodology",
    body:
      "PULSE combined metric review, counterfactual analysis, intersectional heatmap inspection, and role-based governance review using the same fixture structure as the live audit flow.",
  },
];

function normalizeReportSections(data, fallbackSections) {
  if (Array.isArray(data?.sections)) {
    return data.sections;
  }

  if (typeof data?.report === "string") {
    return [{ title: "Generated Report", body: data.report }];
  }

  if (typeof data?.text === "string") {
    return [{ title: "Generated Report", body: data.text }];
  }

  return fallbackSections;
}

export default function ReportPage() {
  const { selectedModel, selectedLanguage } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeSections, setActiveSections] = useState([]);

  const fallbackSections = selectedModel === "biased" ? reportSections : fairReportSections;

  const generateReport = async () => {
    setLoading(true);
    setGenerated(false);
    setActiveSections([]);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: selectedModel,
          analysis_results: fallbackSections,
        }),
      });

      if (!response.ok) {
        throw new Error("Report request failed");
      }

      const data = await response.json();
      setActiveSections(normalizeReportSections(data, fallbackSections));
      setGenerated(true);
    } catch {
      setActiveSections(fallbackSections);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
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
              <button className="button button-secondary" onClick={() => window.print()}>
                Download in Tamil
              </button>
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
          {activeSections.map((section) => (
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
