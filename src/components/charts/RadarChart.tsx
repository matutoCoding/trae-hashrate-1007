import type { RadarScores } from "../../types";

interface RadarChartProps {
  scores: RadarScores;
  size?: number;
}

const AXES: { key: keyof RadarScores; label: string }[] = [
  { key: "porosity", label: "孔洞率" },
  { key: "uniformity", label: "均匀度" },
  { key: "normalRatio", label: "正常孔占比" },
  { key: "defectFree", label: "无缺陷率" },
  { key: "sizeTarget", label: "尺寸达标" },
  { key: "color", label: "色泽一致" },
];

export default function RadarChart({ scores, size = 340 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const n = AXES.length;

  const getPt = (idx: number, r: number) => {
    const a = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  };

  const polyPts = AXES.map((ax, i) => {
    const r = radius * (scores[ax.key] / 100);
    const p = getPt(i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  const gridPolys = [0.25, 0.5, 0.75, 1].map((f) =>
    AXES.map((_, i) => {
      const p = getPt(i, radius * f);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  const axisLines = AXES.map((_, i) => {
    const p = getPt(i, radius);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  const avgScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  );

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[360px]">
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C9A66B" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#4A7C59" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        {gridPolys.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="#E8DFCD"
            strokeWidth={i === 3 ? 1.2 : 0.8}
            strokeDasharray={i < 3 ? "2 3" : undefined}
          />
        ))}

        {axisLines.map((ln, i) => (
          <line key={i} {...ln} stroke="#E8DFCD" strokeWidth="0.8" />
        ))}

        <polygon
          points={polyPts}
          fill="url(#radarFill)"
          stroke="#C9A66B"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {AXES.map((ax, i) => {
          const r = radius * (scores[ax.key] / 100);
          const p = getPt(i, r);
          return (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="#C9A66B" strokeWidth="1.8" />
          );
        })}

        {AXES.map((ax, i) => {
          const p = getPt(i, radius * 1.18);
          const sc = scores[ax.key];
          return (
            <g key={i}>
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="600"
                fill="#2B2A27"
              >
                {ax.label}
              </text>
              <text
                x={p.x}
                y={p.y + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#6B655A"
                fontWeight="500"
              >
                {sc}分
              </text>
            </g>
          );
        })}

        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="11"
          fill="#6B655A"
        >
          均分
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#8E6C3D"
          className="font-serif"
        >
          {avgScore}
        </text>
      </svg>
    </div>
  );
}
