interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  targetMin?: number;
  targetMax?: number;
  unit?: string;
  label?: string;
  size?: number;
}

export default function GaugeChart({
  value,
  min = 0,
  max = 40,
  targetMin = 10,
  targetMax = 22,
  unit = "%",
  label = "孔洞率",
  size = 260,
}: GaugeChartProps) {
  const cx = size / 2;
  const cy = size * 0.6;
  const r = size * 0.38;
  const startAngle = -180;
  const endAngle = 0;

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const ratio = (clamp(value) - min) / (max - min);
  const angle = startAngle + ratio * (endAngle - startAngle);
  const targetMinRatio = (targetMin - min) / (max - min);
  const targetMaxRatio = (targetMax - min) / (max - min);
  const inRange = value >= targetMin && value <= targetMax;

  const polar = (ang: number, rad: number) => {
    const a = (ang * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad };
  };
  const arc = (ang1: number, ang2: number, rad: number, color: string, width = 18) => {
    const p1 = polar(ang1, rad);
    const p2 = polar(ang2, rad);
    const large = ang2 - ang1 <= 180 ? 0 : 1;
    return (
      <path
        d={`M ${p1.x} ${p1.y} A ${rad} ${rad} 0 ${large} 1 ${p2.x} ${p2.y}`}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  };

  const pointerTip = polar(angle, r * 0.92);
  const pointerBase1 = polar(angle - 92, r * 0.18);
  const pointerBase2 = polar(angle + 92, r * 0.18);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size * 0.85}`} className="w-full max-w-[320px]">
        <defs>
          <linearGradient id="gauge-low" x1="0" x2="1">
            <stop offset="0%" stopColor="#B33951" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="gauge-mid" x1="0" x2="1">
            <stop offset="0%" stopColor="#4A7C59" />
            <stop offset="100%" stopColor="#61A576" />
          </linearGradient>
          <linearGradient id="gauge-high" x1="0" x2="1">
            <stop offset="0%" stopColor="#D4A017" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B33951" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {arc(startAngle, startAngle + targetMinRatio * 180, r, "url(#gauge-low)")}
        {arc(
          startAngle + targetMinRatio * 180,
          startAngle + targetMaxRatio * 180,
          r,
          "url(#gauge-mid)"
        )}
        {arc(startAngle + targetMaxRatio * 180, endAngle, r, "url(#gauge-high)")}

        {Array.from({ length: 13 }).map((_, i) => {
          const a = startAngle + (i / 12) * 180;
          const p1 = polar(a, r * 1.12);
          const p2 = polar(a, r * 1.22);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#C9A66B"
              strokeWidth={i === 0 || i === 6 || i === 12 ? 2 : 1}
              opacity={i === 0 || i === 6 || i === 12 ? 1 : 0.5}
            />
          );
        })}

        <path
          d={`M ${pointerBase1.x} ${pointerBase1.y} L ${pointerTip.x} ${pointerTip.y} L ${pointerBase2.x} ${pointerBase2.y} Z`}
          fill="#2B2A27"
          stroke="#C9A66B"
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={cy} r="10" fill="#2B2A27" stroke="#C9A66B" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3.5" fill="#C9A66B" />

        <text
          x={cx}
          y={cy + r * 0.42}
          textAnchor="middle"
          className="font-serif"
          fontSize="34"
          fontWeight="700"
          fill={inRange ? "#4A7C59" : "#B33951"}
        >
          {value.toFixed(1)}
          <tspan fontSize="16" fill="#6B655A" fontWeight="500">
            {unit}
          </tspan>
        </text>
        <text x={cx} y={cy + r * 0.62} textAnchor="middle" fontSize="12" fill="#6B655A">
          {label}
        </text>

        {[min, targetMin, targetMax, max].map((t, i) => {
          const r2 = (t - min) / (max - min);
          const a2 = startAngle + r2 * 180;
          const p = polar(a2, r * 1.35);
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize="10"
              fill="#6B655A"
              fontWeight="500"
            >
              {t}
            </text>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span
          className={`badge ${
            inRange ? "bg-algae-100 text-algae-700" : "bg-wine-100 text-wine-700"
          }`}
        >
          {inRange ? "✓ 达标" : "✗ 未达标"}
        </span>
        <span className="text-cream-subtext">
          目标区间 {targetMin}~{targetMax}
          {unit}
        </span>
      </div>
    </div>
  );
}
