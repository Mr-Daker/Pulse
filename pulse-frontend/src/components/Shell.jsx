import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MODELS } from '../data/demoData';

function Badge({ tone, children }) {
  const cls = tone === 'err' ? 'badge-err' : tone === 'ok' ? 'badge-ok' : tone === 'warn' ? 'badge-warn' : 'badge-neu';
  return <span className={`badge ${cls}`}>{children}</span>;
}

const ROLE_LABELS = { '/doctor': 'Doctor View', '/builder': 'ML Builder', '/auditor': 'Auditor' };

export default function Shell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedModel, setSelectedModel } = useApp();
  const m = MODELS[selectedModel];
  const isLanding = location.pathname === '/';
  const roleLabel = ROLE_LABELS[location.pathname] || '';

  return (
    <>
      <div className="topbar">
        <button className="logo btn-ghost" onClick={() => navigate('/')}>
          <span className="logo-dot" />
          <span style={{ fontFamily: 'var(--font-h)', fontWeight: 700, fontSize: 17, color: 'var(--t1)' }}>PULSE</span>
        </button>

        {!isLanding && (
          <>
            <span className="topbar-role">{roleLabel}</span>
            <span className="topbar-spacer" />
            <div className="model-toggle">
              <button
                className={`model-opt ${selectedModel === 'fair' ? 'active fair' : ''}`}
                onClick={() => setSelectedModel('fair')}
              >
                Model A — FairSepsis
              </button>
              <button
                className={`model-opt ${selectedModel === 'biased' ? 'active biased' : ''}`}
                onClick={() => setSelectedModel('biased')}
              >
                Model B — SepsisScore
              </button>
            </div>
            <Badge tone={m.tone}>{m.verdict}</Badge>
            <button className="btn btn-secondary text-sm" onClick={() => navigate('/')}>
              Switch Role
            </button>
          </>
        )}
      </div>
      {children}
    </>
  );
}

export { Badge };
