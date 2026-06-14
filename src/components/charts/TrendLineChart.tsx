import type { TrendPoint } from "../../types";

interface Props {
  points: TrendPoint[];
  currentDay: number;
  targetMax?: number;
}

export default function TrendLineChart({ points, currentDay, targetMax = 22 }: Props) {
  const W = 820;
  const H = 320;
  const padL = 48;
  const padR = 64;
  const padT = 28;
  const padB = 44;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const maxDay = Math.max(...points.map((p) => p.day));
  const maxP = Math.max(...points.map((p) => Math.max(p.avgDiameter * 4, p.porosityRate, p.abnormalRatio)), 50);
  const minP = 0;

  const xFor = (d: number) => padL + (d / maxDay) * iw;
  const yFor = (v: number) => padT + ih - ((v - minP) / (maxP - minP)) * ih;

  const buildPath = (key: keyof TrendPoint, scale = 1) => {
    let d = "";
    points.forEach((p, i) => {
      const x = xFor(p.day);
      const y = yFor((p[key] as number) * scale);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return d;
  };
  const buildArea = (key: keyof TrendPoint, scale = 1) => {
    let top = "";
    points.forEach((p, i) => {
      const x = xFor(p.day);
      const y = yFor((p[key] as number) * scale);
      top += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    const lastX = xFor(points[points.length - 1].day);
    const firstX = xFor(points[0].day);
    return `${top} L ${lastX} ${yFor(0)} L ${firstX} ${yFor(0)} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTickCount = Math.min(8, points.length);

  const currentX = xFor(currentDay);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]">
        <defs>
          <linearGradient id="trendArea1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C9A66B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9A66B" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="trendArea2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#B33951" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#B33951" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((f, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={padL + iw}
              y1={padT + ih * f}
              y2={padT + ih * f}
              stroke="#E8DFCD"
              strokeDasharray={i === 0 || i === yTicks.length - 1 ? "0" : "2 3"}
              strokeWidth="0.7"
            />
            <text
              x={padL - 6}
              y={padT + ih * f + 3}
              textAnchor="end"
              fontSize="10"
              fill="#6B655A"
            >
              {Math.round(maxP * (1 - f))}
            </text>
          </g>
        ))}

        {Array.from({ length: xTickCount + 1 }, (_, i) => {
          const f = i / xTickCount;
          const day = Math.round(maxDay * f);
          return (
            <g key={`x-${i}`}>
              <line
                x1={xFor(day)}
                x2={xFor(day)}
                y1={padT}
                y2={padT + ih + 4}
                stroke="#E8DFCD"
                strokeWidth="0.5"
              />
              <text
                x={xFor(day)}
                y={padT + ih + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#6B655A"
              >
                第{day}天
              </text>
            </g>
          );
        })}

        <rect
          x={padL}
          y={yFor(targetMax)}
          width={iw}
          height={ih - (yFor(targetMax) - padT)}
          fill="#B33951"
          opacity="0.06"
        />
        <line
          x1={padL}
          x2={padL + iw}
          y1={yFor(targetMax)}
          y2={yFor(targetMax)}
          stroke="#B33951"
          strokeDasharray="5 3"
          strokeWidth="1"
          opacity="0.6"
        />
        <text
          x={padL + iw + 6}
          y={yFor(targetMax) + 3}
          fontSize="9"
          fill="#B33951"
          fontWeight="600"
        >
          孔洞率上限 {targetMax}%
        </text>

        <path d={buildArea("porosityRate")} fill="url(#trendArea1)" opacity="0.8" />
        <path d={buildArea("abnormalRatio")} fill="url(#trendArea2)" opacity="0.7" />

        <path
          d={buildPath("porosityRate")}
          fill="none"
          stroke="#C9A66B"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={buildPath("avgDiameter", 4)}
          fill="none"
          stroke="#4A7C59"
          strokeWidth="2.2"
          strokeDasharray="6 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={buildPath("abnormalRatio")}
          fill="none"
          stroke="#B33951"
          strokeWidth="2.2"
          strokeDasharray="3 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0).map((p, i) => (
          <g key={i}>
            <circle cx={xFor(p.day)} cy={yFor(p.porosityRate)} r="3" fill="#fff" stroke="#C9A66B" strokeWidth="1.5" />
            <circle cx={xFor(p.day)} cy={yFor(p.avgDiameter * 4)} r="2.5" fill="#fff" stroke="#4A7C59" strokeWidth="1.5" />
            <circle cx={xFor(p.day)} cy={yFor(p.abnormalRatio)} r="2.5" fill="#fff" stroke="#B33951" strokeWidth="1.5" />
          </g>
        ))}

        <line
          x1={currentX}
          x2={currentX}
          y1={padT - 10}
          y2={padT + ih + 10}
          stroke="#2B2A27"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <polygon
          points={`${currentX},${padT - 14} ${currentX - 5},${padT - 22} ${currentX + 5},${padT - 22}`}
          fill="#2B2A27"
          opacity="0.75"
        />
        <rect
          x={currentX - 32}
          y={padT - 40}
          width="64"
          height="16"
          rx="3"
          fill="#2B2A27"
          opacity="0.85"
        />
        <text
          x={currentX}
          y={padT - 29}
          textAnchor="middle"
          fontSize="10"
          fill="#fff"
          fontWeight="600"
        >
          第{currentDay}天 · 当前
        </text>
      </svg>

      <div className="flex items-center justify-center gap-6 mt-2 flex-wrap text-[11px]">
        <span className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5 bg-cheese-500 rounded" />
          孔洞率 %
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-6 border-t-[2px] border-dashed border-algae-500" />
          平均孔径 mm (×4 缩放)
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-6 border-t-[2px] border-dashed border-wine-500" />
          异常孔占比 %
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-wine-500 bg-wine-500/10 rounded-sm" />
          孔洞率超限风险区
        </span>
      </div>
    </div>
  );
}
