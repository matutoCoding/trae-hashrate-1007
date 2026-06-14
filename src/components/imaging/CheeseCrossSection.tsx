import { useMemo } from "react";
import type { Hole, Defect, HoleCategory } from "../../types";

interface Props {
  holes: Hole[];
  defects: Defect[];
  highlightCategory?: HoleCategory | null;
  size?: number;
  showDefects?: boolean;
}

const CAT_COLOR: Record<HoleCategory, { fill: string; stroke: string }> = {
  micro: { fill: "#B0D2BA55", stroke: "#4A7C59" },
  small: { fill: "#88BC9866", stroke: "#3B6346" },
  medium: { fill: "#61A57677", stroke: "#2D4A34" },
  large: { fill: "#D0A96277", stroke: "#8E6C3D" },
  xlarge: { fill: "#B3395155", stroke: "#6D2130" },
  crack: { fill: "#CF536F66", stroke: "#B33951" },
};

export default function CheeseCrossSection({
  holes,
  defects,
  highlightCategory,
  size = 480,
  showDefects = true,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  const gradient = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const rr = r * (0.96 + Math.sin(i * 2.1) * 0.03);
        return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
      }).join(" "),
    [cx, cy, r]
  );

  return (
    <div className="relative" style={{ width: size, maxWidth: "100%", aspectRatio: "1 / 1" }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        <defs>
          <radialGradient id="cheeseBody" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#F6E3B5" />
            <stop offset="50%" stopColor="#E6C47A" />
            <stop offset="85%" stopColor="#C99B4E" />
            <stop offset="100%" stopColor="#A5793A" />
          </radialGradient>
          <radialGradient id="cheeseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="transparent" />
            <stop offset="100%" stopColor="#8B5E20" stopOpacity="0.55" />
          </radialGradient>
          <filter id="holeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" />
            <feOffset dx="0.6" dy="0.8" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.45" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={r + 8} fill="url(#cheeseGlow)" />
        <polygon points={gradient} fill="url(#cheeseBody)" stroke="#A5793A" strokeWidth="1.5" />

        {Array.from({ length: 80 }).map((_, i) => {
          const a = (i * 7919) % 360;
          const rad = r * 0.93;
          const dx = cx + Math.cos((a * Math.PI) / 180) * rad * ((i * 37) % 100) / 100;
          const dy = cy + Math.sin((a * Math.PI) / 180) * rad * ((i * 53) % 100) / 100;
          const s = 0.4 + ((i * 13) % 10) * 0.12;
          return (
            <circle
              key={`speck-${i}`}
              cx={dx}
              cy={dy}
              r={s}
              fill="#B8883A"
              opacity={0.18 + ((i * 7) % 10) * 0.015}
            />
          );
        })}

        <g filter="url(#holeShadow)">
          {holes.map((h) => {
            const dim = highlightCategory && highlightCategory !== h.category;
            const col = CAT_COLOR[h.category];
            const px = cx + (h.centerX - 0.5) * 2 * r * 0.93;
            const py = cy + (h.centerY - 0.5) * 2 * r * 0.93;
            const d = Math.min(h.diameter * 2.2, r * 0.9);
            if (h.category === "crack") {
              const rot = ((h.aspectRatio * 23 + h.id.charCodeAt(4)) % 180);
              return (
                <g key={h.id} opacity={dim ? 0.2 : 1}>
                  <ellipse
                    cx={px}
                    cy={py}
                    rx={d * 0.55}
                    ry={Math.max(1.2, d / (h.aspectRatio * 1.5))}
                    fill={col.fill}
                    stroke={col.stroke}
                    strokeWidth="1.2"
                    transform={`rotate(${rot} ${px} ${py})`}
                  />
                </g>
              );
            }
            return (
              <circle
                key={h.id}
                cx={px}
                cy={py}
                r={d * 0.5}
                fill={col.fill}
                stroke={col.stroke}
                strokeWidth={h.diameter > 12 ? 1.5 : 0.9}
                opacity={dim ? 0.22 : 0.95}
              />
            );
          })}
        </g>

        {showDefects &&
          defects.map((d) => {
            const px = cx + (d.posX - 0.5) * 2 * r * 0.93;
            const py = cy + (d.posY - 0.5) * 2 * r * 0.93;
            const sz = Math.min(d.size * 2.5, r * 0.7);
            const isBlister = d.type === "early_blister";
            const color = isBlister ? "#D4A017" : "#B33951";
            return (
              <g key={d.id}>
                <circle
                  cx={px}
                  cy={py}
                  r={sz * 0.5}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeDasharray={isBlister ? "0" : "6 4"}
                  className="animate-pulse-soft"
                />
                <circle
                  cx={px}
                  cy={py}
                  r="4"
                  fill={color}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <rect
                  x={px + 8}
                  y={py - 22}
                  width={d.label.length * 9 + 12}
                  height="18"
                  rx="3"
                  fill={color}
                  opacity="0.92"
                />
                <text
                  x={px + 14}
                  y={py - 9}
                  fontSize="10"
                  fontWeight="600"
                  fill="#fff"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

        <circle cx={cx} cy={cy} r={r * 0.93} fill="none" stroke="#8B5E20" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="2 5" />
      </svg>
    </div>
  );
}
