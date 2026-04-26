import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function barColor(value) {
  if (value < 50) return "#c00000";
  if (value < 60) return "#c55a11";
  return "#2e75b6";
}

function tooltipContent({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{item.label}</strong>
      <p>Mean risk score: {item.value}</p>
    </div>
  );
}

export default function BarChart({ items }) {
  return (
    <div className="chart-card">
      <div className="section-heading">
        <h3>Mean Risk Score by Demographic Group</h3>
        <p>Descending score pattern makes demographic divergence visible at a glance.</p>
      </div>
      <div className="chart-frame chart-frame-bar">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={items} margin={{ top: 12, right: 12, left: -14, bottom: 18 }}>
            <CartesianGrid stroke="#dfe7f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-10}
              textAnchor="end"
              height={70}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip cursor={{ fill: "rgba(31, 56, 100, 0.06)" }} content={tooltipContent} />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {items.map((item) => (
                <Cell key={item.label} fill={barColor(item.value)} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
