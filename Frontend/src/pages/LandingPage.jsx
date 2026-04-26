import { useNavigate } from "react-router-dom";
import { landingStats } from "../data/demoData";
import logoImage from "../assets/logo.png";
import pillImage from "../assets/pill.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <button className="landing-brand" onClick={() => navigate("/")}>
          <span className="logo-frame">
            <img src={logoImage} alt="" />
          </span>
          <span>PULSE</span>
        </button>
        <nav className="landing-menu" aria-label="Landing navigation">
          <button className="landing-menu-active">Home</button>
          <button onClick={() => navigate("/upload")}>Audit</button>
          <button onClick={() => navigate("/select")}>Models</button>
          <button onClick={() => navigate("/report")}>Reports</button>
        </nav>
        <button className="landing-login" onClick={() => navigate("/upload")}>
          Run Audit
        </button>
      </header>

      <section className="landing-hero">
        <p className="landing-kicker">Medical AI bias intelligence for Indian healthcare</p>
        <h1>
          MEDICAL AI FAIRNESS,
          <span> MADE VISIBLE</span>
        </h1>
        <p className="landing-subtitle">
          PULSE detects, explains, and prescribes fixes for hidden demographic
          harm in clinical AI systems.
        </p>

        <div className="hero-visual" aria-label="PULSE medical AI audit preview">
          <button className="floating-chip chip-left-top">
            Counterfactual audit
            <span>+</span>
          </button>
          <button className="floating-chip chip-left-bottom">
            Doctor view
            <span>+</span>
          </button>
          <button className="floating-chip chip-right-top">
            Tamil voice alert
            <span>+</span>
          </button>
          <button className="floating-chip chip-right-bottom">
            Governance report
            <span>+</span>
          </button>

          <img src={pillImage} alt="" className="pill-asset" />
          <div className="hero-audit-bar">
            <span>Audit sepsis risk model</span>
            <button onClick={() => navigate("/upload")}>Get Started</button>
          </div>
        </div>

        <div className="landing-insight landing-insight-left">
          <div className="insight-head">
            <span>Bias signal</span>
            <strong>+43%</strong>
          </div>
          <p>Risk score depression for rural elderly women</p>
          <div className="mini-meter">
            <span style={{ width: "74%" }} />
          </div>
        </div>

        <div className="landing-insight landing-insight-right">
          <div className="insight-head">
            <span>Audit confidence</span>
            <strong>92%</strong>
          </div>
          <p>Standard accuracy can still hide intersectional harm</p>
          <div className="mini-chart" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {landingStats.map((stat) => (
          <article className="landing-stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
