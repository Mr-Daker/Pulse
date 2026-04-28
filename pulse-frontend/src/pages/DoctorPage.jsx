import { useState, useEffect, useRef, useCallback } from 'react';
import Shell, { Badge } from '../components/Shell';
import { useApp } from '../context/AppContext';
import { MODELS, TRANSLATIONS, SPEECH_LANG_MAP, API_URL } from '../data/demoData';

export default function DoctorPage() {
  const { selectedModel, setSelectedModel, language, setLanguage } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const m = MODELS[selectedModel];

  // Clear chat when model changes
  useEffect(() => {
    setMessages([]);
  }, [selectedModel]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history for API
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model_id: selectedModel,
          language,
          history,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          audit: data.audit,
        }]);
      } else {
        // Fallback response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Unable to process your request at the moment. Please try again.',
          audit: {
            verdict: m.pass ? 'PASS' : 'BIAS_DETECTED',
            language_alert: TRANSLATIONS[language]?.watch || m.doctor.watch,
            counterfactuals: [],
            reasoning: 'API unavailable — showing cached bias assessment.',
          },
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Showing cached bias assessment for this model.',
        audit: {
          verdict: m.pass ? 'PASS' : 'BIAS_DETECTED',
          language_alert: TRANSLATIONS[language]?.watch || m.doctor.watch,
          counterfactuals: [],
          reasoning: 'API unavailable — showing cached bias assessment.',
        },
      }]);
    }
    setLoading(false);
  }, [input, loading, messages, selectedModel, language, m]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const speakAlert = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG_MAP[language] || 'en-IN';
    u.rate = 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
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
            <p>Model B underscores remote elderly female patients. Chat responses are audited in real time.</p>
          </div>
        )}

        {/* Language selector — compact row at top */}
        <div className="card mb-4" style={{ padding: '12px 20px' }}>
          <div className="flex-row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginRight: 8 }}>
              Audit Language:
            </span>
            <div className="lang-row" style={{ flex: 1 }}>
              {Object.entries(TRANSLATIONS).map(([key, val]) => (
                <button
                  key={key}
                  className={`lang-btn ${language === key ? 'active' : ''}`}
                  onClick={() => setLanguage(key)}
                  style={{ padding: '5px 12px', fontSize: 13 }}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat interface */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          {/* Chat history */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 8 }}>
                  Describe your patient and clinical question
                </p>
                <p style={{ fontSize: 13 }}>
                  PULSE will audit the AI response for demographic bias in real time
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`chat-msg ${msg.role}`}>
                  {msg.content}
                </div>

                {/* Audit panel below AI responses */}
                {msg.audit && (
                  <AuditPanel
                    audit={msg.audit}
                    language={language}
                    onSpeak={speakAlert}
                    speaking={speaking}
                  />
                )}
              </div>
            ))}

            {loading && (
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area" style={{ padding: '16px 20px', borderTop: '1px solid var(--brd)' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your patient and clinical question…"
              rows={2}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--brd)', borderRadius: 8, background: 'var(--s2)', color: 'var(--t1)', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              {loading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Audit Panel below each AI response ─────────────────────────────────── */
function AuditPanel({ audit, language, onSpeak, speaking }) {
  const [showCf, setShowCf] = useState(false);
  const isBias = audit.verdict === 'BIAS_DETECTED';

  return (
    <div style={{ marginTop: 6, marginLeft: 0, maxWidth: '85%' }}>
      {/* Verdict badge */}
      <div className="flex-row" style={{ gap: 8, marginBottom: 6 }}>
        <Badge tone={isBias ? 'err' : 'ok'}>
          {isBias ? 'BIAS DETECTED' : 'PASS'}
        </Badge>
        {audit.language_alert && language !== 'en' && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '2px 8px' }}
            onClick={() => onSpeak(audit.language_alert)}
            disabled={speaking}
          >
            🔊 {speaking ? 'Speaking…' : 'Speak Alert'}
          </button>
        )}
      </div>

      {/* Translated alert */}
      {audit.language_alert && (
        <div className={`chat-audit ${isBias ? 'alert-err' : 'alert-ok'}`} style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 6 }}>
          <p style={{ fontSize: 13, margin: 0 }}>{audit.language_alert}</p>
        </div>
      )}

      {/* Reasoning */}
      {audit.reasoning && (
        <p style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', margin: '4px 0 6px' }}>
          {audit.reasoning}
        </p>
      )}

      {/* Expandable counterfactuals */}
      {audit.counterfactuals && audit.counterfactuals.length > 0 && (
        <div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '2px 0', color: 'var(--acc)' }}
            onClick={() => setShowCf(!showCf)}
          >
            {showCf ? '▾ Hide counterfactuals' : '▸ View counterfactuals'}
          </button>
          {showCf && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {audit.counterfactuals.map((cf, i) => (
                <div key={i} className="card-inset" style={{ padding: '8px 12px', minWidth: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    {cf.title}
                  </div>
                  <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: cf.delta > 0 && isBias ? 'var(--err)' : 'var(--t1)' }}>
                    {cf.score}
                  </div>
                  {cf.delta !== 0 && (
                    <div style={{ fontSize: 12, color: cf.delta > 0 && isBias ? 'var(--err)' : 'var(--ok)' }}>
                      {cf.delta > 0 ? '+' : ''}{cf.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
