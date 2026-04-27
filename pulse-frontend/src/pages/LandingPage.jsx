import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell';

const ROLES = [
  {
    path:    '/doctor',
    label:   'Clinician',
    name:    'Doctor View',
    accent:  'var(--acc)',
    iconBg:  'oklch(68% .17 196 / .12)',
    iconBdr: 'oklch(68% .17 196 / .3)',
    desc:    'Plain-language bias alerts for your patients, delivered in your language.',
    features: [
      'Translated clinical warnings (5 Indian languages)',
      'Text-to-speech alert playback',
      'Patient-specific bias impact summary',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    iconBg:  'oklch(70% .18 150 / .12)',
    iconBdr: 'oklch(70% .18 150 / .3)',
    desc:    'Full audit suite — metrics, counterfactuals, causal analysis, and live AI reasoning.',
    features: [
      'Demographic parity + equalized odds metrics',
      'Counterfactual patient scenarios',
      'Live chain-of-thought bias reasoning',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    path:    '/auditor',
    label:   'Administrator',
    name:    'Auditor View',
    accent:  'var(--warn)',
    iconBg:  'oklch(75% .17 65 / .12)',
    iconBdr: 'oklch(75% .17 65 / .3)',
    desc:    'Compliance overview, temporal drift monitoring, and downloadable governance reports.',
    features: [
      'Risk rating and affected population',
      'Model fairness score over time',
      'DISHA-aligned audit report export',
    ],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="landing">
        <div className="landing-kicker">Medical AI Bias Intelligence</div>
        <h1 className="landing-title">
          Medical AI Fairness,<br /><em>Made Visible</em>
        </h1>
        <p className="landing-sub">
          PULSE detects, explains, and prescribes fixes for hidden demographic
          harm in clinical AI systems — in your language.
        </p>

        <div className="role-grid">
          {ROLES.map(r => (
            <div key={r.path} className="role-card fade-up" onClick={() => navigate(r.path)}>
              <div
                className="role-icon"
                style={{ background: r.iconBg, border: `1px solid ${r.iconBdr}` }}
              >
                {r.icon}
              </div>
              <div>
                <div className="role-label">{r.label}</div>
                <div className="role-name">{r.name}</div>
              </div>
              <p className="role-desc">{r.desc}</p>
              <ul className="role-features">
                {r.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <div className="role-enter" style={{ color: r.accent }}>
                Enter <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
