import { useState, useRef, useCallback, useEffect } from 'react';
import { MODELS, API_URL } from '../data/demoData';
import { Badge } from './Shell';

export default function ReasoningPanel({ modelId }) {
  const [state, setState]   = useState('idle');   // idle | running | done
  const [text, setText]     = useState('');
  const boxRef              = useRef(null);
  const abortRef            = useRef(null);
  const fullText            = MODELS[modelId].reasoning;

  // Reset when model changes
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    setState('idle');
    setText('');
  }, [modelId]);

  const runTypewriter = useCallback((str) => {
    let i = 0;
    const tick = () => {
      if (i < str.length) {
        setText(str.slice(0, i + 1));
        i++;
        setTimeout(tick, 16);
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
      } else {
        setState('done');
      }
    };
    tick();
  }, []);

  const run = useCallback(async () => {
    setState('running');
    setText('');

    // Try SSE streaming endpoint first
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/api/analyze/reason/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          disparity_finding: modelId === 'biased'
            ? '33-point disparity detected for P-0142 across demographic counterfactuals'
            : 'No clinically unjustified disparity detected in counterfactual analysis',
          model_id: modelId,
        }),
        signal: controller.signal,
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                setState('done');
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.token) {
                  accumulated += parsed.token;
                  setText(accumulated);
                  if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
        // If we get here without [DONE], mark as done
        if (accumulated.length > 0) {
          setState('done');
          return;
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Fall through to non-streaming API
    }

    // Fallback: try non-streaming /reason endpoint
    try {
      const res = await fetch(`${API_URL}/api/analyze/reason`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          disparity_finding: modelId === 'biased'
            ? '33-point disparity detected for P-0142 across demographic counterfactuals'
            : 'No clinically unjustified disparity detected in counterfactual analysis',
          model_id: modelId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const liveText = data.reasoning
          ? `Classification: ${data.classification}\n\n${data.reasoning}\n\nRecommendation:\n${data.recommendation}`
          : fullText;
        runTypewriter(liveText);
        return;
      }
    } catch {
      // fall through to demo
    }

    // Final fallback — animate pre-computed text
    runTypewriter(fullText);
  }, [modelId, fullText, runTypewriter]);

  const m = MODELS[modelId];

  return (
    <div>
      <div className="flex-row mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ marginBottom: 4 }}>Live AI Reasoning</h3>
          <p style={{ fontSize: 13, margin: 0 }}>
            Chain-of-thought bias analysis streamed from the PULSE Reasoner (Groq)
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={state === 'running'}
        >
          {state === 'idle' ? 'Run Reasoning' : state === 'running' ? 'Streaming…' : 'Re-run'}
        </button>
      </div>

      {state === 'idle' ? (
        <div className="rsn-box rsn-empty">
          Click &ldquo;Run Reasoning&rdquo; to stream the AI audit chain-of-thought
        </div>
      ) : (
        <div className="rsn-box" ref={boxRef}>
          {text}
          {state === 'running' && <span className="rsn-cursor" />}
        </div>
      )}

      {state === 'done' && (
        <div className={`alert ${m.pass ? 'alert-ok' : 'alert-err'} mt-4`}>
          <strong>
            {m.pass
              ? 'NO CLINICALLY UNJUSTIFIED DISPARITY'
              : 'STRUCTURALLY HARMFUL BIAS DETECTED'}
          </strong>
          <p>
            {m.pass
              ? 'Model A is cleared for clinical decision-support use. Continue routine monitoring.'
              : 'Model B must not be used as a primary decision tool for remote elderly female patients. Immediate human review required.'}
          </p>
        </div>
      )}
    </div>
  );
}
