import { useState, useRef, useCallback, useEffect } from 'react';
import { MODELS } from '../data/demoData';

export default function ReasoningPanel({ modelId }) {
  const [state, setState] = useState('idle'); // idle | running | done
  const [text, setText]   = useState('');
  const boxRef            = useRef(null);
  const timerRef          = useRef(null);
  const m = MODELS[modelId];
  const fullText = m.reasoning;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('idle');
    setText('');
  }, [modelId]);

  const runTypewriter = useCallback((str) => {
    let i = 0;
    const tick = () => {
      if (i < str.length) {
        setText(str.slice(0, i + 1));
        i++;
        timerRef.current = setTimeout(tick, 12);
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
      } else {
        setState('done');
      }
    };
    tick();
  }, []);

  const run = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('running');
    setText('');
    runTypewriter(fullText);
  }, [fullText, runTypewriter]);

  return (
    <div>
      {/* Pre-computed notice banner */}
      <div
        style={{
          background: 'var(--warn-d)', border: '1px solid var(--warn-b)',
          borderRadius: 6, padding: '8px 14px', marginBottom: 16,
          fontSize: 12, color: 'var(--t2)',
        }}
        role="note"
      >
        <strong style={{ color: 'var(--warn)' }}>Pre-computed Analysis</strong> — These results are from a batch inference run on a 500-patient dataset, not a live streaming call. The typewriter animation reflects the actual chain-of-thought output produced during that analysis.
      </div>

      <div className="flex-row mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ marginBottom: 4 }}>AI Bias Reasoning</h3>
          <p style={{ fontSize: 13, margin: 0 }}>
            Step-by-step chain-of-thought bias audit — {m.pass ? 'Model A (FairSepsis v2)' : 'Model B (SepsisScore v1)'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={state === 'running'}
          aria-busy={state === 'running'}
          aria-label={state === 'idle' ? 'Run bias reasoning animation' : state === 'running' ? 'Reasoning in progress' : 'Re-run reasoning animation'}
        >
          {state === 'idle' ? 'Run Reasoning' : state === 'running' ? 'Running…' : 'Re-run'}
        </button>
      </div>

      {state === 'idle' ? (
        <div className="rsn-box rsn-empty">
          Click &ldquo;Run Reasoning&rdquo; to animate the chain-of-thought bias audit
        </div>
      ) : (
        <div className="rsn-box" ref={boxRef} aria-live="polite" aria-label="Reasoning output">
          {text}
          {state === 'running' && <span className="rsn-cursor" aria-hidden="true" />}
        </div>
      )}

      {state === 'done' && (
        <div className={`alert ${m.pass ? 'alert-ok' : 'alert-err'} mt-4`} role="status">
          <strong>
            {m.pass
              ? 'NO CLINICALLY UNJUSTIFIED DISPARITY'
              : 'STRUCTURALLY HARMFUL BIAS DETECTED'}
          </strong>
          <p>
            {m.pass
              ? 'Model A is cleared for clinical decision-support use. Continue routine monitoring.'
              : 'Model B must not be used as a primary decision tool for remote elderly female PMJAY patients. Immediate mandatory human review required.'}
          </p>
        </div>
      )}
    </div>
  );
}
