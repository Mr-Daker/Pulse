import { useState, useEffect, useCallback } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, API_URL } from '../data/demoData';
import { MetricCard, BarChart, Heatmap, CounterfactualCards } from '../components/Charts';
import PatientTable from '../components/PatientTable';
import ReasoningPanel from '../components/ReasoningPanel';

const TABS = [
  ['metrics',        'Metrics & Heatmap'],
  ['counterfactuals','Counterfactuals'],
  ['patients',       'Patient Table'],
  ['reasoning',      'Live Reasoning'],
  ['causal',         'Causal Graph'],
];

/* ── CausalGraph (inline) ───────────────────────────────────────────────────── */
function CausalGraph({ data, loading }) {
  if (loading) return <p style={{ fontSize: 13, color: 'var(--t2)' }}>Loading causal graph…</p>;
  if (!data)   return null;

  const weightColor = (w) => w === 'High weight' ? 'var(--err)' : w === 'Medium weight' ? 'var(--warn)' : 'var(--ok)';
  const weightPct   = (w) => w === 'High weight' ? 90 : w === 'Medium weight' ? 55 : 30;

  return (
    <div>
      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Clinical factors */}
        <div className="card-sm">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--ok)', marginBottom: 14 }}>
            Clinical Factors
          </div>
          {data.clinical.map(f => (
            <div key={f.label} style={{ marginBottom: 12 }}>
              <div className="flex-row mb-1" style={{ gap: 8 }}>
                <span className="font-mono" style={{ fontSize: 12, flex: 1 }}>{f.label}</span>
                <span style={{ fontSize: 11, color: 'var(--t2)' }}>{f.weight}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--s2)' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${weightPct(f.weight)}%`, background: 'var(--ok)', transition: 'width .4s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Demographic factors */}
        <div className="card-sm">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: data.demographic.length ? 'var(--err)' : 'var(--ok)', marginBottom: 14 }}>
            Demographic Factors {data.demographic.length ? '⚠ Bias detected' : '✓ None significant'}
          </div>
          {data.demographic.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>No demographic inputs with unjustified influence detected.</p>
          )}
          {data.demographic.map(f => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <div className="flex-row mb-1" style={{ gap: 8 }}>
                <span className="font-mono" style={{ fontSize: 12, flex: 1, color: 'var(--err)' }}>{f.label}</span>
                <span style={{ fontSize: 11, color: weightColor(f.weight) }}>{f.weight}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--s2)', marginBottom: 6 }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${weightPct(f.weight)}%`, background: 'var(--err)', transition: 'width .4s' }} />
              </div>
              {f.detail && (
                <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>{f.detail}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  const { selectedModel, builderTab, setBuilderTab } = useApp();
  const m = MODELS[selectedModel];

  // Live data states — all fall back to demo data on error
  const [apiMetrics,  setApiMetrics]  = useState(null);
  const [cfData,      setCfData]      = useState(m.cf);
  const [cfLoading,   setCfLoading]   = useState(false);
  const [patientRows, setPatientRows] = useState(null);
  const [causalData,  setCausalData]  = useState(null);
  const [causalLoading, setCausalLoading] = useState(false);

  // Load metrics + patient rows from API on model change
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

  // Reset cf data when model changes
  useEffect(() => {
    setCfData(m.cf);
  }, [selectedModel, m.cf]);

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

  const loadCausalGraph = useCallback(async () => {
    setCausalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analyze/causal-graph`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        setCausalData(data);
      }
    } catch { /* causal data stays null */ }
    setCausalLoading(false);
  }, [selectedModel]);

  // Auto-load causal graph when tab is opened
  useEffect(() => {
    if (builderTab === 'causal' && !causalData && !causalLoading) {
      loadCausalGraph();
    }
  }, [builderTab, causalData, causalLoading, loadCausalGraph]);

  // Use live metrics if available, else fall back to demo
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
      <div className="page-wrap fade-up">
        {m.tone === 'err' && (
          <div className="bias-banner">
            <strong>Bias Detected</strong>
            <p>
              Model B shows statistically significant, clinically unjustified
              demographic disparity. Details below.
            </p>
          </div>
        )}

        <div className="tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={`tab ${builderTab === key ? 'active' : ''}`}
              onClick={() => setBuilderTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Metrics ─────────────────────────────────────────────────────── */}
        {builderTab === 'metrics' && (
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
        )}

        {/* ── Counterfactuals ──────────────────────────────────────────────── */}
        {builderTab === 'counterfactuals' && (
          <div className="fade-up">
            <div className="section-heading">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3>Counterfactual Analysis</h3>
                  <p>
                    Same patient, same vitals — only demographics changed.
                    Score differences expose what the model has learned.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={runLiveCf}
                  disabled={cfLoading}
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
              <div className="alert alert-err mt-4">
                <strong>33-point disparity on identical clinical data</strong>
                <p>
                  A young urban male with the same vitals scores 71. Priya (67, remote, PMJAY) scores 38.
                  The clinical presentation is identical. The difference is entirely demographic.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Patients ─────────────────────────────────────────────────────── */}
        {builderTab === 'patients' && (
          <div className="fade-up">
            <div className="section-heading">
              <h3>Patient Audit Table</h3>
              <p>Score comparison across patients. Red dots indicate clinically significant bias gap (&gt;15 pts).</p>
            </div>
            <div className="card-flush">
              <PatientTable modelId={selectedModel} rows={patientRows} />
            </div>
            <p style={{ fontSize: 12, marginTop: 12 }}>
              {patientRows
                ? `Showing ${patientRows.length} patients from live dataset. Flagged patients show a bias gap with no clinical justification.`
                : 'Showing 8 of 500 patients. Flagged patients show a bias gap with no clinical justification.'}
            </p>
          </div>
        )}

        {/* ── Reasoning ────────────────────────────────────────────────────── */}
        {builderTab === 'reasoning' && (
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
        )}

        {/* ── Causal Graph ─────────────────────────────────────────────────── */}
        {builderTab === 'causal' && (
          <div className="fade-up">
            <div className="section-heading">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3>Causal Decision Graph</h3>
                  <p>
                    Which input features drive the model's risk score?
                    Demographic factors with high weight and no clinical basis indicate structural bias.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={loadCausalGraph}
                  disabled={causalLoading}
                  style={{ marginTop: 2 }}
                >
                  {causalLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="card-sm mb-6">
              <CausalGraph data={causalData} loading={causalLoading} />
              {!causalData && !causalLoading && (
                <p style={{ fontSize: 13, color: 'var(--t2)' }}>Causal graph will load automatically.</p>
              )}
            </div>

            {causalData && m.tone === 'err' && causalData.demographic?.length > 0 && (
              <div className="alert alert-err mt-4">
                <strong>Non-clinical inputs detected in decision path</strong>
                <p>
                  district_type and insurance_type are influencing sepsis risk scores with no
                  physiological basis. These variables are acting as proxies for historical
                  care quality disparities, not patient acuity.
                </p>
              </div>
            )}
            {causalData && m.tone !== 'err' && causalData.demographic?.length === 0 && (
              <div className="alert alert-ok mt-4">
                <strong>Clinical factors only</strong>
                <p>
                  Model A's decision path is driven by clinical inputs (HR, BP, Lactate, WBC).
                  No demographic amplification detected.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
