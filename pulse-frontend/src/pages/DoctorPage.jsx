import { useState, useEffect, useCallback } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, TRANSLATIONS, SPEECH_LANG_MAP, API_URL } from '../data/demoData';

export default function DoctorPage() {
  const { selectedModel, setSelectedModel, language, setLanguage } = useApp();
  const [speaking, setSpeaking]     = useState(false);
  const [translating, setTranslating] = useState(false);
  const [liveDoc, setLiveDoc]       = useState(null); // { watch, patient, prompt }
  const m = MODELS[selectedModel];

  // Reset live translation when model or language changes
  useEffect(() => {
    setLiveDoc(null);
  }, [selectedModel, language]);

  // For English always use model-specific text directly; for other languages
  // use live-translated text (fetched per model), falling back to demo translations
  const displayDoc = language === 'en'
    ? m.doctor
    : (liveDoc ?? TRANSLATIONS[language]);

  const fetchTranslation = useCallback(async (lang, model) => {
    if (lang === 'en') return;
    setTranslating(true);
    const doc = MODELS[model].doctor;
    try {
      const [w, pa, pr] = await Promise.all(
        ['watch', 'patient', 'prompt'].map((field, i) =>
          fetch(`${API_URL}/api/translate`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: [doc.watch, doc.patient, doc.prompt][i], target_language: lang }),
          }).then(r => r.json()).then(d => d.translated_text)
        )
      );
      setLiveDoc({ watch: w || TRANSLATIONS[lang]?.watch, patient: pa || TRANSLATIONS[lang]?.patient, prompt: pr || TRANSLATIONS[lang]?.prompt });
    } catch {
      // keep demo translations as fallback
    }
    setTranslating(false);
  }, []);

  const handleLangChange = (key) => {
    setLanguage(key);
    fetchTranslation(key, selectedModel);
  };

  const speak = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u   = new SpeechSynthesisUtterance(displayDoc.watch);
    u.lang    = SPEECH_LANG_MAP[language] || 'en-IN';
    u.rate    = 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend   = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      <Shell />
      <div className="page-narrow fade-up">

        {m.tone === 'err' && (
          <div className="bias-banner">
            <strong>Bias Detected</strong>
            <p>Model B underscores remote elderly female patients. See translated alerts below.</p>
          </div>
        )}

        {/* Language selector */}
        <div className="card mb-6">
          <div className="flex-row mb-4" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ marginBottom: 4 }}>Bias Alert Language</h3>
              <p style={{ fontSize: 13, margin: 0 }}>Clinical findings will display in the selected language</p>
            </div>
            <button className="btn btn-secondary" onClick={speak} disabled={speaking || translating}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
              </svg>
              {speaking ? 'Speaking…' : 'Speak Alert'}
            </button>
          </div>
          <div className="lang-row">
            {Object.entries(TRANSLATIONS).map(([key, val]) => (
              <button
                key={key}
                className={`lang-btn ${language === key ? 'active' : ''}`}
                onClick={() => handleLangChange(key)}
              >
                {val.label}
              </button>
            ))}
          </div>
          {translating && (
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>Translating via PULSE AI…</p>
          )}
        </div>

        {/* Alert */}
        <div className={`alert ${m.tone === 'err' ? 'alert-err' : 'alert-ok'} mb-6`}>
          <strong>
            {m.tone === 'err' ? 'Clinical Warning — Bias Risk' : 'Clinical Clearance — Model Passed'}
          </strong>
          <p>{displayDoc.watch}</p>
        </div>

        {/* Context cards */}
        <div className="grid-2 mb-6">
          <div className="card-sm">
            <h4 style={{ marginBottom: 10 }}>Patient Context</h4>
            <p style={{ fontSize: 14 }}>{displayDoc.patient}</p>
          </div>
          <div className="card-sm">
            <h4 style={{ marginBottom: 10 }}>Clinical Prompt Guidance</h4>
            <p style={{ fontSize: 14 }}>{displayDoc.prompt}</p>
          </div>
        </div>

        {/* Model status */}
        <div className="card">
          <div className="flex-row mb-4">
            <h3 style={{ flex: 1 }}>Active Model</h3>
            <Badge tone={m.tone}>{m.verdict}</Badge>
          </div>
          <div className="model-toggle mb-4">
            <button
              className={`model-opt ${selectedModel === 'fair' ? 'active fair' : ''}`}
              onClick={() => setSelectedModel('fair')}
            >
              Model A — FairSepsis v2
            </button>
            <button
              className={`model-opt ${selectedModel === 'biased' ? 'active biased' : ''}`}
              onClick={() => setSelectedModel('biased')}
            >
              Model B — SepsisScore v1
            </button>
          </div>
          <div className="grid-3">
            {m.metrics.map(met => (
              <div className="card-inset" key={met.label}>
                <div className="flex-row mb-2">
                  <span style={{ fontSize: 12, color: 'var(--t2)', flex: 1 }}>
                    {met.label.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className={`badge ${met.tone === 'err' ? 'badge-err' : 'badge-ok'}`} style={{ fontSize: 10 }}>
                    {met.status}
                  </span>
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 20, fontWeight: 700, color: met.tone === 'err' ? 'var(--err)' : 'var(--ok)' }}
                >
                  {met.value.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
