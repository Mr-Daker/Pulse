import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell';

const ROLES = [
  {
    path:    '/doctor',
    label:   'Clinician',
    name:    'Doctor View',
    accent:  'var(--acc)',
    iconBg:  'rgba(37,99,235,0.08)',
    iconBdr: 'rgba(37,99,235,0.2)',
    desc:    'Live chat with real-time bias audit — ask clinical questions, get immediate fairness analysis in your language.',
    features: [
      'Live chat with real-time bias audit',
      'Language Bias Probe — 6 Indian languages',
      'Text-to-speech alert playback',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
        <path d="M12 14v4m-2-2h4"/>
      </svg>
    ),
  },
  {
    path:    '/builder',
    label:   'ML Engineer',
    name:    'Builder View',
    accent:  'var(--ok)',
    iconBg:  'rgba(22,163,74,0.08)',
    iconBdr: 'rgba(22,163,74,0.2)',
    desc:    'Full audit suite — metrics, counterfactuals, causal analysis, and live AI reasoning.',
    features: [
      'Demographic parity + equalized odds metrics',
      'Gender, Age & Income counterfactuals',
      'Live chain-of-thought bias reasoning',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    path:    '/auditor',
    label:   'Administrator',
    name:    'Auditor View',
    accent:  'var(--warn)',
    iconBg:  'rgba(217,119,6,0.08)',
    iconBdr: 'rgba(217,119,6,0.2)',
    desc:    'Compliance overview, temporal drift monitoring, and downloadable governance reports.',
    features: [
      'Risk rating and affected population',
      'Model fairness score over time',
      'DISHA-aligned audit report export',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Shell />
      <main id="main-content" role="main">
        <div className="landing">
          <p className="landing-kicker" aria-label="Medical AI Bias Intelligence platform">
            Medical AI Bias Intelligence
          </p>
          <h1 className="landing-title">
            Medical AI Fairness,<br /><em>Made Visible</em>
          </h1>
          <p className="landing-sub">
            PULSE detects, explains, and prescribes fixes for hidden demographic
            harm in clinical AI systems — in your language.
          </p>

          <nav
            aria-label="Select your role to enter the platform"
          >
            <div className="role-grid">
              {ROLES.map(r => (
                <div
                  key={r.path}
                  className="role-card fade-up"
                  onClick={() => navigate(r.path)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(r.path)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Enter ${r.name} — ${r.desc}`}
                >
                  <div
                    className="role-icon"
                    style={{ background: r.iconBg, border: `1px solid ${r.iconBdr}` }}
                    aria-hidden="true"
                  >
                    {r.icon}
                  </div>
                  <div>
                    <div className="role-label">{r.label}</div>
                    <div className="role-name">{r.name}</div>
                  </div>
                  <p className="role-desc">{r.desc}</p>
                  <ul className="role-features" aria-label={`Features of ${r.name}`}>
                    {r.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="role-enter" style={{ color: r.accent }} aria-hidden="true">
                    Enter <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </main>
    </>
  );
}
