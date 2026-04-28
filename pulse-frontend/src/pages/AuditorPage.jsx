import { useState, useEffect, useRef } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, API_URL } from '../data/demoData';
import { DriftChart } from '../components/Charts';

function formatDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildLocalSections(modelId) {
  const m = MODELS[modelId];
  const sections = [
    {
      title: 'Executive Summary',
      body: m.pass
        ? 'PULSE audited FairSepsis v2 (Google Health AI) for sepsis risk scoring. No clinically unjustified demographic disparity was detected. The model is cleared for clinical decision-support use.'
        : 'PULSE audited SepsisScore v1 (Legacy System) for sepsis risk scoring. Statistically significant and clinically unjustified bias was detected against remote elderly female PMJAY patients. The model should not be used as a primary decision tool for this demographic.',
    },
    {
      title: 'Bias Findings',
      body: m.pass
        ? 'Demographic Parity Gap: 0.04 (PASS). Equalized Odds Gap: 0.03 (PASS). Calibration Gap: 0.02 (PASS). All metrics within acceptable bounds. Counterfactual analysis shows no demographic amplification — score differences remain within stochastic variance.'
        : 'Demographic Parity Gap: 0.23 (FAIL). Equalized Odds Gap: 0.21 (FAIL). Calibration Gap: 0.18 (FAIL). Counterfactual analysis: Gender change alone causes +14 point increase. Age change causes +17. Insurance change (PMJAY → Private) causes +21. Causal analysis identifies district_type and insurance_type as high-weight demographic inputs with no clinical justification.',
    },
    {
      title: 'Affected Populations',
      body: m.pass
        ? 'No group at elevated risk from model predictions. Remote, rural, and urban cohorts received comparable risk scores for equivalent clinical severity.'
        : 'Remote elderly female patients (age 60+, PMJAY insurance, remote district type) are systematically underscored. This group represents approximately 12% of the PMJAY patient base in affected districts.',
    },
    {
      title: 'Population Vulnerability Summary',
      body: m.pass
        ? 'No statistically significant vulnerable subgroup identified. All demographic cohorts receive clinically equivalent scores.'
        : 'Rank 1 (Most Vulnerable): Remote Elderly Women (Age 60+, PMJAY) — Average risk score 38 vs 68 for equivalent urban male patients. 30-point gap on identical clinical vitals. Clinical risk: Risk of missed sepsis diagnosis at critical intervention window. Recommended action: Mandatory human review for all matching patients.\n\nRank 2: Rural Elderly Women (Age 60+, PMJAY) — Average risk score 42 vs 68 for baseline. 26-point gap. Clinical risk: Delayed escalation in district hospitals. Recommended action: Flag for clinical review.\n\nRank 3: Rural Female Patients (All ages, State Insurance) — Average risk score 44 vs 58 fair model equivalent. 14-point gap. Clinical risk: Systematic undertriage. Recommended action: Monitor and audit quarterly.',
    },
    {
      title: 'Recommendations',
      body: m.pass
        ? 'Maintain FairSepsis v2 in standard clinical decision-support use. Continue quarterly fairness monitoring as new district data is onboarded.'
        : '(1) Suspend clinical decision-support use for Female, 60+, Remote/Rural, PMJAY patients immediately. (2) Apply mandatory human review flag for all matching patients. (3) Retrain with representative district data. (4) Apply post-processing fairness constraint prior to redeployment.',
    },
    {
      title: 'Methodology',
      body: 'PULSE combines intersectional metric analysis (Demographic Parity, Equalized Odds, Calibration), patient-level counterfactual testing (Gender, Age, and Income axes — demographics swapped independently, clinical features held constant), and the PULSE Medical Bias Reasoner — an AI system grounded in Indian healthcare context. Results are surfaced across three role-specific views: clinician, model builder, and governance.',
    },
  ];

  const verdict = m.pass ? 'CLEARED FOR DEPLOYMENT' : 'SUSPEND CLINICAL USE';
  sections.push({ title: 'PULSE Verdict', body: `PULSE VERDICT: ${verdict}` });
  return sections;
}

/* ── Inline report view ──────────────────────────────────────────────────── */
function ReportView({ sections, modelId, reportRef }) {
  const m = MODELS[modelId];
  return (
    <div ref={reportRef} style={{ borderTop: '1px solid var(--brd)', paddingTop: 24 }}>
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
          <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', fontWeight: s.title === 'PULSE Verdict' ? 700 : 400 }}>
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({ label, value, tone }) {
  const color = tone === 'err' ? 'var(--err)' : tone === 'ok' ? 'var(--ok)' : 'var(--t1)';
  return (
    <div style={{
      background: 'rgba(248,250,252,0.7)', border: '1px solid rgba(226,232,240,0.6)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
        {label.split(' ').slice(0, 2).join(' ')}
      </div>
      <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color }}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AuditorPage() {
  const { selectedModel } = useApp();
  const [genState,      setGenState]      = useState('idle');
  const [reportModel,   setReportModel]   = useState(null);
  const [reportSections,setReportSections]= useState(null);
  const [driftData,     setDriftData]     = useState({ fair: null, biased: null });
  const [exporting,     setExporting]     = useState(false);
  const reportRef = useRef(null);

  const fa = MODELS.fair;
  const bi = MODELS.biased;
  const m  = MODELS[selectedModel];

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
        if (Array.isArray(rFair) && Array.isArray(rBiased)) {
          setDriftData({ fair: rFair.map(d => d.value), biased: rBiased.map(d => d.value) });
        }
      } catch { /* fallback to demo data */ }
    };
    loadDrift();
  }, []);

  const generate = async () => {
    setGenState('loading');
    const modelId = selectedModel;
    let sections = null;
    try {
      const res = await fetch(`${API_URL}/api/report/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sections && Array.isArray(data.sections)) sections = data.sections;
      }
    } catch { /* fall through */ }
    if (!sections) sections = buildLocalSections(modelId);
    setReportSections(sections);
    setReportModel(modelId);
    setGenState('done');
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF }   = await import('jspdf');
      const canvas  = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' });
      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF('p', 'mm', 'a4');
      const pageWidth  = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin     = 20;
      const usableWidth = pageWidth - margin * 2;

      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.text('PULSE', margin, margin + 5);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`Medical AI Bias Audit Report — ${MODELS[reportModel]?.name || ''}`, margin, margin + 12);
      pdf.text(`Date: ${formatDate()}`, margin, margin + 18);

      const imgWidth  = usableWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      let   remainingHeight = imgHeight;
      let   pageY = margin + 25;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - pageY - margin;
        pdf.addImage(imgData, 'PNG', margin, pageY, imgWidth, imgHeight, undefined, 'FAST');
        remainingHeight -= availableHeight;
        if (remainingHeight > 0) { pdf.addPage(); pageY = margin; }
      }
      pdf.save(`PULSE_Audit_Report_${reportModel}.pdf`);
    } catch (err) { console.error('PDF export failed:', err); }
    setExporting(false);
  };

  return (
    <>
      <Shell />
      <main id="main-content" role="main">
        <div className="page-wrap fade-up">

          {/* ── Model overview ──────────────────────────────────────── */}
          <div className="section-heading">
            <h3>Model Overview</h3>
            <p>Audit status for all registered clinical AI models</p>
          </div>

          <div className="grid-2 mb-6">
            {[fa, bi].map(md => (
              <div
                key={md.id}
                className="card"
                style={{
                  borderColor: md.pass ? 'rgba(134,239,172,0.5)' : 'rgba(254,202,202,0.5)',
                  borderWidth: 1,
                }}
              >
                <div className="flex-row mb-4">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>{md.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--t2)' }}>Sepsis risk scoring — Indian healthcare</div>
                  </div>
                  <Badge tone={md.tone}>{md.verdict}</Badge>
                </div>
                <div className="grid-3" style={{ gap: 8 }}>
                  {md.metrics.map(met => (
                    <StatTile
                      key={met.label}
                      label={met.label}
                      value={met.value}
                      tone={met.tone}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Compliance & Risk ───────────────────────────────────── */}
          <div className="section-heading">
            <h3>Compliance &amp; Risk — {m.short}</h3>
          </div>

          <div className="grid-2 mb-6">
            {[
              ['Risk Rating',         m.admin.risk],
              ['Affected Population', m.admin.pop],
              ['Recommended Action',  m.admin.action],
              ['Compliance Note',     m.admin.compliance],
            ].map(([label, body]) => (
              <div className="card-sm" key={label}>
                <h4 style={{ marginBottom: 8, fontSize: 13, color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {label}
                </h4>
                <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* ── Temporal Drift ──────────────────────────────────────── */}
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
                <DriftChart data={driftData[md.id] ?? md.drift} modelId={md.id} />
                {!md.pass && (
                  <p style={{ fontSize: 12, marginTop: 8, color: 'var(--err)' }}>
                    Fairness degraded after Q4 2022 when new district data was onboarded.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ── Governance Report ───────────────────────────────────── */}
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
                aria-busy={genState === 'loading'}
                aria-label={genState === 'loading' ? 'Generating audit report, please wait' : 'Generate governance audit report'}
              >
                {genState === 'loading' ? 'Generating…' : 'Generate Report'}
              </button>
              {genState === 'done' && (
                <button
                  className="btn btn-secondary"
                  onClick={exportPDF}
                  disabled={exporting}
                  aria-busy={exporting}
                  aria-label={exporting ? 'Exporting PDF, please wait' : 'Export audit report as PDF'}
                >
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
              )}
            </div>

            {genState === 'loading' && (
              <div style={{ color: 'var(--t2)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
                <div className="typing-indicator" style={{ justifyContent: 'center', margin: '0 auto 12px' }}>
                  <span /><span /><span />
                </div>
                Writing structured audit report…
              </div>
            )}

            {genState === 'done' && reportModel && reportSections && (
              <ReportView sections={reportSections} modelId={reportModel} reportRef={reportRef} />
            )}
          </div>

        </div>
      </main>
    </>
  );
}
