import { useState, useEffect } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, API_URL } from '../data/demoData';
import { DriftChart } from '../components/Charts';

// Dynamic date formatter
function formatDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Fallback local report sections (used if API is unreachable)
function buildLocalSections(modelId) {
  const m = MODELS[modelId];
  return [
    {
      title: 'Executive Summary',
      body: m.pass
        ? 'PULSE audited Model A (FairSepsis v2) for sepsis risk scoring. No clinically unjustified demographic disparity was detected. The model is cleared for clinical decision-support use.'
        : 'PULSE audited Model B (SepsisScore v1) for sepsis risk scoring. Statistically significant and clinically unjustified bias was detected against remote elderly female PMJAY patients. The model should not be used as a primary decision tool for this demographic.',
    },
    {
      title: 'Bias Findings',
      body: m.pass
        ? 'Demographic Parity Gap: 0.04 (PASS). Equalized Odds Gap: 0.03 (PASS). Calibration Gap: 0.02 (PASS). All metrics within acceptable bounds. Counterfactual analysis shows no demographic amplification — score differences remain within stochastic variance.'
        : 'Demographic Parity Gap: 0.23 (FAIL). Equalized Odds Gap: 0.21 (FAIL). Calibration Gap: 0.18 (FAIL). Counterfactual analysis: 33-point score spread on identical clinical vitals across demographic profiles. Causal analysis identifies district_type and insurance_type as high-weight demographic inputs with no clinical justification.',
    },
    {
      title: 'Affected Populations',
      body: m.pass
        ? 'No group at elevated risk from model predictions. Remote, rural, and urban cohorts received comparable risk scores for equivalent clinical severity.'
        : 'Remote elderly female patients (age 60+, PMJAY insurance, remote district type) are systematically underscored. This group represents approximately 12% of the PMJAY patient base in affected districts.',
    },
    {
      title: 'Recommendations',
      body: m.pass
        ? 'Maintain Model A in standard clinical decision-support use. Continue quarterly fairness monitoring as new district data is onboarded.'
        : '(1) Suspend clinical decision-support use for Female, 60+, Remote/Rural, PMJAY patients immediately. (2) Apply mandatory human review flag for all matching patients. (3) Retrain with representative district data. (4) Apply post-processing fairness constraint prior to redeployment.',
    },
    {
      title: 'Methodology',
      body: 'PULSE combines intersectional metric analysis (Demographic Parity, Equalized Odds, Calibration), patient-level counterfactual testing (demographics swapped, clinical features held constant), and the PULSE Medical Bias Reasoner — an AI system grounded in Indian healthcare context. Results are surfaced across three role-specific views: clinician, model builder, and governance.',
    },
  ];
}

function ReportView({ sections, modelId }) {
  const m = MODELS[modelId];
  return (
    <div style={{ borderTop: '1px solid var(--brd)', paddingTop: 24 }}>
      <div className="flex-row mb-6">
        <div>
          <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 6 }}>
            PULSE Audit Output
          </div>
          <h2 style={{ fontSize: '1.2rem' }}>Medical AI Bias Audit Report</h2>
        </div>
        <div className="ml-auto" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>Model audited: {m.name}</div>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>Date: {formatDate()}</div>
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>PULSE v0.1.0</div>
        </div>
      </div>
      {sections.map(s => (
        <div className="report-section" key={s.title}>
          <h4>{s.title}</h4>
          <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function AuditorPage() {
  const { selectedModel } = useApp();
  const [genState, setGenState]   = useState('idle'); // idle | loading | done
  const [reportModel, setReportModel] = useState(null);
  const [reportSections, setReportSections] = useState(null);
  const [driftData, setDriftData] = useState({ fair: null, biased: null });

  const fa = MODELS.fair;
  const bi = MODELS.biased;
  const m  = MODELS[selectedModel];

  // Load live temporal drift from API on mount
  useEffect(() => {
    const loadDrift = async () => {
      try {
        const [rFair, rBiased] = await Promise.all([
          fetch(`${API_URL}/api/analyze/temporal-drift`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: 'fair' }),
          }).then(r => r.json()),
          fetch(`${API_URL}/api/analyze/temporal-drift`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: 'biased' }),
          }).then(r => r.json()),
        ]);
        // Backend returns [{quarter, value}], extract values for DriftChart
        if (Array.isArray(rFair) && Array.isArray(rBiased)) {
          setDriftData({ fair: rFair.map(d => d.value), biased: rBiased.map(d => d.value) });
        }
      } catch {
        // fallback to demo data (handled via null check below)
      }
    };
    loadDrift();
  }, []);

  const generate = async () => {
    setGenState('loading');
    const modelId = selectedModel;
    let sections = null;

    try {
      const res = await fetch(`${API_URL}/api/report/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model_id: modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sections && Array.isArray(data.sections)) {
          sections = data.sections;
        }
      }
    } catch { /* fall through */ }

    // Fallback to local sections if API didn't return valid data
    if (!sections) sections = buildLocalSections(modelId);

    setReportSections(sections);
    setReportModel(modelId);
    setGenState('done');
  };

  return (
    <>
      <Shell />
      <div className="page-wrap fade-up">

        {/* Models overview */}
        <div className="section-heading">
          <h3>Model Overview</h3>
          <p>Audit status for all registered clinical AI models</p>
        </div>
        <div className="grid-2 mb-6">
          {[fa, bi].map(md => (
            <div
              key={md.id}
              className="card"
              style={{ borderColor: md.pass ? 'var(--ok-b)' : 'var(--err-b)' }}
            >
              <div className="flex-row mb-4">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{md.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
                    Sepsis risk scoring — Indian healthcare
                  </div>
                </div>
                <Badge tone={md.tone}>{md.verdict}</Badge>
              </div>
              <div className="grid-3" style={{ gap: 8 }}>
                {md.metrics.map(met => (
                  <div
                    key={met.label}
                    style={{ background: 'var(--s2)', border: '1px solid var(--brd)', borderRadius: 6, padding: '10px 12px' }}
                  >
                    <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>
                      {met.label.split(' ').slice(0, 2).join(' ')}
                    </div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: met.tone === 'err' ? 'var(--err)' : 'var(--ok)' }}>
                      {met.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Compliance */}
        <div className="section-heading"><h3>Compliance & Risk — {m.short}</h3></div>
        <div className="grid-2 mb-6">
          {[
            ['Risk Rating',         m.admin.risk],
            ['Affected Population', m.admin.pop],
            ['Recommended Action',  m.admin.action],
            ['Compliance Note',     m.admin.compliance],
          ].map(([label, body]) => (
            <div className="card-sm" key={label}>
              <h4 style={{ marginBottom: 8 }}>{label}</h4>
              <p style={{ fontSize: 14 }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Temporal drift */}
        <div className="section-heading">
          <h3>Temporal Drift</h3>
          <p>Fairness score over time — declining values indicate emerging bias</p>
        </div>
        <div className="grid-2 mb-6">
          {[fa, bi].map(md => (
            <div className="card-sm" key={md.id}>
              <div className="flex-row mb-4">
                <span style={{ fontSize: 13, fontWeight: 600 }}>{md.short}</span>
                <Badge tone={md.tone}>{md.verdict}</Badge>
              </div>
              <DriftChart
                data={driftData[md.id] ?? md.drift}
                modelId={md.id}
              />
              {!md.pass && (
                <p style={{ fontSize: 12, marginTop: 8, color: 'var(--err)' }}>
                  Fairness degraded after Q4 2022 when new district data was onboarded.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Report */}
        <div className="section-heading">
          <h3>Governance Report</h3>
          <p>Generate a compliance-ready audit report for hospital governance review</p>
        </div>
        <div className="card">
          <div className="flex-row mb-4" style={{ flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 14, margin: 0, flex: 1, minWidth: 200 }}>
              Structured audit report based on the current model selection and analysis.
            </p>
            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={genState === 'loading'}
            >
              {genState === 'loading' ? 'Generating…' : 'Generate Report'}
            </button>
            {genState === 'done' && (
              <button className="btn btn-secondary" onClick={() => window.print()}>
                Download PDF
              </button>
            )}
          </div>

          {genState === 'loading' && (
            <div style={{ color: 'var(--t2)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
              Writing structured audit report…
            </div>
          )}

          {genState === 'done' && reportModel && reportSections && (
            <ReportView sections={reportSections} modelId={reportModel} />
          )}
        </div>

      </div>
    </>
  );
}
