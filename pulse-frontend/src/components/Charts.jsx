import { PATIENTS, QUARTERS } from '../data/demoData';

/* ── HeatCell ────────────────────────────────────────────────────────────── */
function HeatCell({ value }) {
  const pct = (value - 30) / (75 - 30);
  const lum = 22 + pct * 14;
  const hue = pct < 0.5 ? 22 + pct * 2 * 48 : 70 + (pct - 0.5) * 2 * 80;
  const bg  = `oklch(${lum + 10}% 0.18 ${hue})`;
  const col = `oklch(${lum + 48}% 0.2 ${hue})`;
  return <td className="hm-cell" style={{ background: bg, color: col }}>{value}</td>;
}

/* ── Heatmap ─────────────────────────────────────────────────────────────── */
export function Heatmap({ data }) {
  return (
    <div className="scroll-x">
      <table className="hm-table">
        <thead>
          <tr>
            <th className="hm-th" style={{ textAlign: 'right' }} />
            {data.cols.map(c => <th key={c} className="hm-th">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map(row => (
            <tr key={row.label}>
              <th className="hm-rh">{row.label}</th>
              {row.values.map((v, i) => <HeatCell key={i} value={v} />)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── BarChart ─────────────────────────────────────────────────────────────── */
export function BarChart({ items, modelId }) {
  const isBiased = modelId === 'biased';
  return (
    <div>
      {items.map((item, i) => {
        const pct = item.value;
        const color = isBiased
          ? `oklch(${45 + item.value * 0.35}% 0.22 ${item.value < 50 ? 22 : item.value < 65 ? 65 : 150})`
          : 'var(--ok)';
        return (
          <div className="bc-row" key={i}>
            <span className="bc-label">{item.label}</span>
            <div className="bc-track">
              <div className="bc-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="bc-num">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── MetricCard ──────────────────────────────────────────────────────────── */
export function MetricCard({ metric }) {
  const pct    = (metric.value / metric.max) * 100;
  const color  = metric.tone === 'err' ? 'var(--err)' : 'var(--ok)';
  const bdgCls = metric.tone === 'err' ? 'badge-err' : 'badge-ok';
  return (
    <div className="card-sm mb-4">
      <div className="flex-row mb-2">
        <span style={{ fontSize: 13, color: 'var(--t2)', flex: 1 }}>{metric.label}</span>
        <span className={`badge ${bdgCls}`} style={{ fontSize: 11 }}>{metric.status}</span>
      </div>
      <div className="metric-value" style={{ color }}>{metric.value.toFixed(2)}</div>
      <div className="metric-bar">
        <div className="metric-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{metric.detail}</p>
    </div>
  );
}

/* ── CounterfactualCards ─────────────────────────────────────────────────── */
export function CounterfactualCards({ cf, modelId }) {
  const isBiased = modelId === 'biased';
  const orig     = cf.original;

  function ringStyle(score) {
    const pct = (score - 30) / (75 - 30);
    const hue = pct < 0.5 ? 22 + pct * 2 * 48 : 70 + (pct - 0.5) * 2 * 80;
    return {
      background:   `oklch(${20 + pct * 15}% 0.15 ${hue})`,
      borderColor:  `oklch(${35 + pct * 20}% 0.2  ${hue})`,
      color:        `oklch(${60 + pct * 15}% 0.22 ${hue})`,
    };
  }

  return (
    <div className="cf-grid">
      <div className="cf-card cf-orig">
        <div className="cf-tag">Original Patient</div>
        <div className="cf-ring" style={{
          background:  isBiased ? 'var(--err-d)' : 'var(--ok-d)',
          borderColor: isBiased ? 'var(--err-b)' : 'var(--ok-b)',
          color:       isBiased ? 'var(--err)'   : 'var(--ok)',
        }}>{orig.score}</div>
        <div className="cf-delta" style={{ color: 'var(--t2)' }}>Baseline</div>
        <div className="cf-profile">{orig.profile}</div>
      </div>

      {cf.variants.map((v, i) => {
        const delta     = parseInt(v.delta);
        const deltaColor = isBiased && delta > 0 ? 'var(--err)' : delta > 0 ? 'var(--ok)' : 'var(--t2)';
        return (
          <div className="cf-card" key={i}>
            <div className="cf-tag">{v.title}</div>
            <div className="cf-ring" style={ringStyle(v.score)}>{v.score}</div>
            <div className="cf-delta" style={{ color: deltaColor }}>{v.delta}</div>
            <div className="cf-profile">{v.profile}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── DriftChart ──────────────────────────────────────────────────────────── */
export function DriftChart({ data, modelId }) {
  const W = 560, H = 110;
  const pad = { t: 10, b: 22, l: 30, r: 10 };
  const iW  = W - pad.l - pad.r;
  const iH  = H - pad.t - pad.b;
  const MIN = 0.40, MAX = 1.0;

  const pts = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * iW,
    y: pad.t + (1 - (v - MIN) / (MAX - MIN)) * iH,
    v,
  }));

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = path + ` L${pts[pts.length - 1].x.toFixed(1)},${H - pad.b} L${pts[0].x.toFixed(1)},${H - pad.b} Z`;

  const isBiased = modelId === 'biased';
  const stroke   = isBiased ? 'var(--err)' : 'var(--ok)';
  const fillCol  = isBiased ? 'oklch(63% 0.24 22 / 0.08)' : 'oklch(70% 0.18 150 / 0.08)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="drift-svg" preserveAspectRatio="none">
      <path d={fill} fill={fillCol} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={stroke} />
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} fontSize="9" fill="var(--t3)" textAnchor="middle">
          {QUARTERS[i]}
        </text>
      ))}
    </svg>
  );
}
