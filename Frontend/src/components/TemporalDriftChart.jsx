import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function tooltipContent({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{point.quarter}</strong>
      <p>Fairness metric: {point.value.toFixed(2)}</p>
      {point.note ? <p>{point.note}</p> : null}
    </div>
  );
}

export default function TemporalDriftChart({ data }) {
  const annotatedPoint = data.find((point) => point.note);

  return (
    <div className="chart-card">
      <div className="section-heading">
        <h3>Temporal Drift</h3>
        <p>Quarterly fairness tracking shows when performance starts to deteriorate.</p>
      </div>
      <div className="chart-frame chart-frame-line">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#dfe7f0" strokeDasharray="3 3" />
            <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
            <YAxis
              domain={[0.4, 0.95]}
              tickLine={false}
              axisLine={false}
              width={38}
            />
            <Tooltip content={tooltipContent} />
            {annotatedPoint ? (
              <ReferenceLine
                x={annotatedPoint.quarter}
                stroke="#c55a11"
                strokeDasharray="4 4"
                label={{
                  value: annotatedPoint.note,
                  position: "insideTopRight",
                  fill: "#c55a11",
                  fontSize: 12,
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1f3864"
              strokeWidth={3}
              dot={{ fill: "#2e75b6", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: "#c00000" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
