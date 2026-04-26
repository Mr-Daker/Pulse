import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

function toneFor(value) {
  if (value < 50) return "danger";
  if (value < 60) return "warning";
  return "success";
}

function fillFor(value) {
  if (value < 50) return "#fde9e9";
  if (value < 60) return "#fff0dc";
  return "#eaf6e3";
}

function strokeFor(value) {
  if (value < 50) return "#c00000";
  if (value < 60) return "#c55a11";
  return "#375623";
}

function HeatmapCellShape({ cx, cy, payload }) {
  const size = 76;

  return (
    <g>
      <rect
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        rx={18}
        fill={payload.tone === "danger" ? `url(#heatmap-stripes-${payload.id})` : payload.fill}
        stroke={payload.stroke}
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fontSize="25"
        fontWeight="800"
        fill={payload.stroke}
      >
        {payload.value}
      </text>
    </g>
  );
}

function tooltipContent({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>
        {item.rowLabel} - {item.columnLabel}
      </strong>
      <p>{item.tooltip}</p>
    </div>
  );
}

export default function Heatmap({ heatmap }) {
  const cells = heatmap.rows.flatMap((row, rowIndex) =>
    row.values.map((value, columnIndex) => ({
      id: `${row.label}-${heatmap.columns[columnIndex]}`,
      x: columnIndex,
      y: rowIndex,
      z: 1,
      rowLabel: row.label,
      columnLabel: heatmap.columns[columnIndex],
      value,
      tone: toneFor(value),
      fill: fillFor(value),
      stroke: strokeFor(value),
      tooltip:
        row.label === "Female" && heatmap.columns[columnIndex] === "Remote"
          ? heatmap.tooltip
          : `${row.label} ${heatmap.columns[columnIndex]} patients received an average risk score of ${value}.`,
    }))
  );

  return (
    <div className="chart-card">
      <div className="section-heading">
        <h3>Intersectional Heatmap</h3>
        <p>{heatmap.tooltip}</p>
      </div>
      <div className="chart-frame chart-frame-heatmap">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 18, right: 18, bottom: 8, left: 18 }}>
            <defs>
              {cells
                .filter((cell) => cell.tone === "danger")
                .map((cell) => (
                  <pattern
                    key={cell.id}
                    id={`heatmap-stripes-${cell.id}`}
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="8" height="8" fill={cell.fill} />
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(192, 0, 0, 0.18)" strokeWidth="4" />
                  </pattern>
                ))}
            </defs>
            <XAxis
              type="number"
              dataKey="x"
              ticks={heatmap.columns.map((_, index) => index)}
              tickFormatter={(value) => heatmap.columns[value] || ""}
              domain={[-0.5, heatmap.columns.length - 0.5]}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              ticks={heatmap.rows.map((_, index) => index)}
              tickFormatter={(value) => heatmap.rows[value]?.label || ""}
              domain={[-0.5, heatmap.rows.length - 0.5]}
              tickLine={false}
              axisLine={false}
              width={62}
              allowDecimals={false}
              reversed
            />
            <ZAxis type="number" dataKey="z" range={[5000, 5000]} />
            <Tooltip cursor={false} content={tooltipContent} />
            <Scatter data={cells} shape={HeatmapCellShape} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
