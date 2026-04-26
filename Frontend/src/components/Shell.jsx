import { NavLink } from "react-router-dom";
import logoImage from "../assets/logo.png";

export default function Shell({ children, currentStep, title, subtitle, actions }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">
          <span className="logo-frame logo-frame-shell">
            <img src={logoImage} alt="" />
          </span>
          <span className="brand-copy">
            <span className="brand-mark">PULSE</span>
            <span className="brand-sub">Bias Intelligence for Medical AI</span>
          </span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/analyze">Analyze</NavLink>
          <NavLink to="/select">Compare Models</NavLink>
          <NavLink to="/report">Report</NavLink>
        </nav>
      </header>

      <main className="page-wrap">
        {(title || subtitle || currentStep || actions) && (
          <section className="page-header">
            <div>
              {currentStep ? <div className="step-label">{currentStep}</div> : null}
              {title ? <h1>{title}</h1> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {actions ? <div className="header-actions">{actions}</div> : null}
          </section>
        )}
        {children}
      </main>
    </div>
  );
}
