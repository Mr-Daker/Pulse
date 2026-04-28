import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MODELS } from '../data/demoData';

function Badge({ tone, children }) {
  const cls =
    tone === 'err'  ? 'badge-err'  :
    tone === 'ok'   ? 'badge-ok'   :
    tone === 'warn' ? 'badge-warn' : 'badge-neu';
  return <span className={`badge ${cls}`}>{children}</span>;
}

const ROLE_LABELS = {
  '/doctor':  'Live Bias Probe',
  '/builder': 'ML Builder',
  '/auditor': 'Auditor',
};

export default function Shell({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { selectedModel, setSelectedModel } = useApp();
  const m         = MODELS[selectedModel];
  const isLanding = location.pathname === '/';
  const roleLabel = ROLE_LABELS[location.pathname] || '';

  return (
    <>
      {/* Skip link for keyboard/screen-reader users */}
      <a href="#main-content" className="skip-nav">Skip to main content</a>

      <header role="banner">
        <div
          className="topbar"
          role="navigation"
          aria-label="PULSE navigation"
        >
          {/* Logo */}
          <button
            className="logo btn-ghost"
            onClick={() => navigate('/')}
            aria-label="PULSE — go to home page"
          >
            <span className="logo-dot" aria-hidden="true" />
            <span style={{
              fontFamily: 'var(--font-h)', fontWeight: 700,
              fontSize: 17, color: 'var(--t1)', letterSpacing: '-0.02em',
            }}>
              PULSE
            </span>
          </button>

          {!isLanding && (
            <>
              {/* Current section pill */}
              <span className="topbar-role" aria-current="page">
                {roleLabel}
              </span>

              <span className="topbar-spacer" aria-hidden="true" />

              {/* Model toggle */}
              <div
                className="model-toggle"
                role="group"
                aria-label="Select model to audit"
              >
                <button
                  className={`model-opt ${selectedModel === 'fair' ? 'active fair' : ''}`}
                  onClick={() => setSelectedModel('fair')}
                  aria-pressed={selectedModel === 'fair'}
                  aria-label="Select Model A — FairSepsis v2"
                >
                  Model A — FairSepsis
                </button>
                <button
                  className={`model-opt ${selectedModel === 'biased' ? 'active biased' : ''}`}
                  onClick={() => setSelectedModel('biased')}
                  aria-pressed={selectedModel === 'biased'}
                  aria-label="Select Model B — SepsisScore v1 (Legacy)"
                >
                  Model B — SepsisScore
                </button>
              </div>

              {/* Verdict badge */}
              <Badge tone={m.tone}>{m.verdict}</Badge>

              {/* Switch role */}
              <button
                className="btn btn-secondary text-sm"
                onClick={() => navigate('/')}
                aria-label="Switch role — return to role selection"
                style={{ flexShrink: 0 }}
              >
                Switch Role
              </button>
            </>
          )}
        </div>
      </header>

      {children}
    </>
  );
}

export { Badge };
