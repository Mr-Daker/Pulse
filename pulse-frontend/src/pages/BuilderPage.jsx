import { useState, useEffect, useCallback } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, API_URL } from '../data/demoData';
import { MetricCard, BarChart, Heatmap, CounterfactualCards } from '../components/Charts';
import PatientTable from '../components/PatientTable';
import ReasoningPanel from '../components/ReasoningPanel';
import CausalGraph from '../components/CausalGraph';

const TABS = [
  ['metrics',        'Metrics & Heatmap'],
  ['counterfactuals','Counterfactuals'],
  ['patients',       'Patient Table'],
  ['reasoning',      'Live Reasoning'],
  ['causal',         'Causal Graph'],
];

export default function BuilderPage() {
  const { selectedModel, builderTab, setBuilderTab } = useApp();
  const m = MODELS[selectedModel];

  const [apiMetrics,  setApiMetrics]  = useState(null);
  const [cfData,      setCfData]      = useState(m.cf);
  const [cfLoading,   setCfLoading]   = useState(false);
  const [patientRows, setPatientRows] = useState(null);

  useEffect(() => {
    setApiMetrics(null);
    setPatientRows(null);
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analyze/metrics`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_id: selectedModel }),
        });
        if (res.ok) {
          const data = await res.json();
          setApiMetrics(data);
          if (data.patientRows) setPatientRows(data.patientRows);
        }
      } catch { /* use demo data */ }
    };
    load();
  }, [selectedModel]);

  useEffect(() => { setCfData(m.cf); }, [selectedModel, m.cf]);

  const runLiveCf = useCallback(async () => {
    setCfLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analyze/counterfactual`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: 'P-0142', model_id: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.original && data.variants) {
          setCfData({
            original: { score: data.original.risk_score ?? data.original.score ?? m.cf.original.score, profile: m.cf.original.profile },
            variants: data.variants.map((v, i) => ({
              title:   v.title   ?? m.cf.variants[i]?.title,
              profile: v.profile ?? m.cf.variants[i]?.profile,
              score:   v.score   ?? 0,
              delta:   v.delta   ?? '0',
            })),
          });
        }
      }
    } catch { /* keep demo data */ }
    setCfLoading(false);
  }, [selectedModel, m.cf]);

  const metrics = apiMetrics?.metrics ?? m.metrics;
  const heatmap = apiMetrics?.heatmap
    ? { cols: apiMetrics.heatmap.columns ?? m.heatmap.cols, rows: apiMetrics.heatmap.rows.map(r => ({ label: r.label, values: r.values })) }
    : m.heatmap;
  const bar = apiMetrics?.barChart
    ? apiMetrics.barChart.map(b => ({ label: b.label, value: b.value }))
    : m.bar;

  return (
    <>
      <Shell />
      <main id="main-content" role="main">
        <div className="page-wrap fade-up">
          {m.tone === 'err' && (
            <div className="bias-banner" role="alert" aria-live="assertive">
              <strong>Bias Detected</strong>
              <p>Model B shows statistically significant, clinically unjustified demographic disparity. Details below.</p>
            </div>
          )}

          <div className="tabs" role="tablist" aria-label="Builder analysis sections">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={builderTab === key}
                aria-controls={`builder-panel-${key}`}
                id={`builder-tab-${key}`}
                className={`tab ${builderTab === key ? 'active' : ''}`}
                onClick={() => setBuilderTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Metrics ──────────────────────────────────────────────────── */}
          <div
            id="builder-panel-metrics"
            role="tabpanel"
            aria-labelledby="builder-tab-metrics"
            hidden={builderTab !== 'metrics'}
          >
            <div className="grid-2 fade-up">
              <div>
                <div className="section-heading">
                  <h3>Fairness Metrics</h3>
                  <p>Three key bias indicators across demographic groups</p>
                </div>
                {metrics.map(met => <MetricCard key={met.label} metric={met} />)}
              </div>
              <div>
                <div className="section-heading">
                  <h3>Risk Score Heatmap</h3>
                  <p>Mean sepsis risk score by location × gender</p>
                </div>
                <div className="card-sm mb-4">
                  <Heatmap data={heatmap} />
                  {m.tone === 'err' && (
                    <p style={{ fontSize: 12, marginTop: 12, color: 'var(--err)' }}>
                      Remote female patients scored 38 vs 68 for urban males on identical clinical presentations.
                    </p>
                  )}
                </div>
                <div className="section-heading mt-6">
                  <h3>Score Distribution</h3>
                </div>
                <div className="card-sm">
                  <BarChart items={bar} modelId={selectedModel} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Counterfactuals ──────────────────────────────────────────── */}
          <div
            id="builder-panel-counterfactuals"
            role="tabpanel"
            aria-labelledby="builder-tab-counterfactuals"
            hidden={builderTab !== 'counterfactuals'}
          >
            <div className="fade-up">
              <div className="section-heading">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <h3>Counterfactual Analysis</h3>
                    <p>
                      Same patient, same vitals — only one demographic variable changed at a time.
                      Gender, Age, and Income (Insurance as proxy) are the three counterfactual axes.
                      Score differences on identical clinical data expose what the model has learned.
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={runLiveCf}
                    disabled={cfLoading}
                    aria-busy={cfLoading}
                    aria-label={cfLoading ? 'Running live counterfactual analysis' : 'Run live counterfactual analysis via Groq API'}
                    style={{ marginTop: 2 }}
                  >
                    {cfLoading ? 'Fetching…' : 'Run Live Counterfactual'}
                  </button>
                </div>
              </div>

              <div className="card-sm mb-6">
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--t3)', marginBottom: 12 }}>
                  Reference patient vitals (identical across all variants)
                </p>
                <div className="grid-3" style={{ gap: 12 }}>
                  {[
                    ['Vitals',   'HR 118, BP 94/62, Temp 38.9°C'],
                    ['Labs',     'WBC 14.2, Lactate 2.8, Creatinine 1.3'],
                    ['Symptoms', 'Pain 7/10, Onset 6h, AMS: No'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>{k}</div>
                      <div className="font-mono" style={{ fontSize: 13, color: 'var(--t1)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <CounterfactualCards cf={cfData} modelId={selectedModel} />

              {m.tone === 'err' && (
                <div className="alert alert-err mt-4" role="note">
                  <strong>Up to 21-point disparity on identical clinical data</strong>
                  <p>
                    Changing only the insurance type (PMJAY → Private) increases the score by 21 points.
                    Gender alone accounts for a 14-point swing. The clinical presentation is identical —
                    the difference is entirely demographic.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Patients ─────────────────────────────────────────────────── */}
          <div
            id="builder-panel-patients"
            role="tabpanel"
            aria-labelledby="builder-tab-patients"
            hidden={builderTab !== 'patients'}
          >
            <div className="fade-up">
              <div className="section-heading">
                <h3>Patient Audit Table</h3>
                <p>Score comparison across patients. Red dots indicate clinically significant bias gap (&gt;15 pts).</p>
              </div>
              <div className="card-flush">
                <PatientTable modelId={selectedModel} rows={patientRows} />
              </div>
              <p style={{ fontSize: 12, marginTop: 12, color: 'var(--t2)' }}>
                {patientRows
                  ? `Showing ${patientRows.length} patients from live dataset (sorted by bias gap).`
                  : 'Showing 8 of 500 patients. Flagged patients show a bias gap with no clinical justification.'}
              </p>
            </div>
          </div>

          {/* ── Reasoning ────────────────────────────────────────────────── */}
          <div
            id="builder-panel-reasoning"
            role="tabpanel"
            aria-labelledby="builder-tab-reasoning"
            hidden={builderTab !== 'reasoning'}
          >
            <div className="fade-up">
              <ReasoningPanel modelId={selectedModel} />
              <div className="divider" />
              <div className="grid-3 mt-4">
                <div className="card-sm">
                  <h4 style={{ marginBottom: 8 }}>Training Data Diagnosis</h4>
                  <p style={{ fontSize: 13 }}>{m.builder.diagnosis}</p>
                </div>
                <div className="card-sm">
                  <h4 style={{ marginBottom: 8 }}>Confidence Diagnostic</h4>
                  <p style={{ fontSize: 13 }}>{m.builder.confidence}</p>
                </div>
                <div className="card-sm">
                  <h4 style={{ marginBottom: 8 }}>Recommended Action</h4>
                  <p style={{ fontSize: 13 }}>{m.builder.action}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Causal Graph ──────────────────────────────────────────────── */}
          <div
            id="builder-panel-causal"
            role="tabpanel"
            aria-labelledby="builder-tab-causal"
            hidden={builderTab !== 'causal'}
          >
            <div className="fade-up">
              <div className="section-heading">
                <h3>Causal Decision Graph</h3>
                <p>
                  Which input features drive the model's risk score?
                  Demographic factors with high weight and no clinical basis indicate structural bias.
                  Click nodes for details. Drag to pan, scroll to zoom.
                </p>
              </div>
              <CausalGraph modelId={selectedModel} />
              {m.tone === 'err' ? (
                <div className="alert alert-err mt-4" role="note">
                  <strong>Non-clinical inputs detected in decision path</strong>
                  <p>
                    district_type and insurance_type are influencing sepsis risk scores with no
                    physiological basis. These variables are acting as proxies for historical
                    care quality disparities, not patient acuity.
                  </p>
                </div>
              ) : (
                <div className="alert alert-ok mt-4" role="note">
                  <strong>Clinical factors only</strong>
                  <p>
                    Model A's decision path is driven by clinical inputs (HR, BP, Lactate, WBC).
                    No demographic amplification detected.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
