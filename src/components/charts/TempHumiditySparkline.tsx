import type { TempHumidityStage } from "../../types";

interface Props {
  stages: TempHumidityStage[];
}

export default function TempHumiditySparkline({ stages }: Props) {
  const W = 560;
  const H = 130;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const cumsum: number[] = [];
  stages.forEach((s, i) => cumsum.push((cumsum[i - 1] || 0) + s.durationHours));
  const total = cumsum[cumsum.length - 1] || 1;

  const tMin = Math.min(...stages.map((s) => s.temperature)) - 4;
  const tMax = Math.max(...stages.map((s) => s.temperature)) + 4;
  const hMin = Math.min(...stages.map((s) => s.humidity)) - 5;
  const hMax = Math.max(...stages.map((s) => s.humidity)) + 5;

  const tempPts: string[] = [];
  const humPts: string[] = [];
  stages.forEach((s, i) => {
    const x0 = padL + ((cumsum[i - 1] || 0) / total) * iw;
    const x1 = padL + (cumsum[i] / total) * iw;
    const ty = padT + ih - ((s.temperature - tMin) / (tMax - tMin)) * ih;
    const hy = padT + ih - ((s.humidity - hMin) / (hMax - hMin)) * ih;
    if (i === 0) tempPts.push(`${x0},${ty}`);
    tempPts.push(`${x1},${ty}`);
    if (i === 0) humPts.push(`${x0},${hy}`);
    humPts.push(`${x1},${hy}`);
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px]">
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <line
            key={i}
            x1={padL}
            x2={padL + iw}
            y1={padT + ih * f}
            y2={padT + ih * f}
            stroke="#E8DFCD"
            strokeDasharray="2 3"
            strokeWidth="0.6"
          />
        ))}
        <text x={4} y={padT + 2} fontSize="9" fill="#6B655A">
          {tMax.toFixed(0)}℃
        </text>
        <text x={4} y={padT + ih} fontSize="9" fill="#6B655A">
          {tMin.toFixed(0)}℃
        </text>

        <polyline
          fill="none"
          stroke="#C9A66B"
          strokeWidth="2"
          points={tempPts.join(" ")}
          strokeLinejoin="round"
        />
        <polyline
          fill="none"
          stroke="#4A7C59"
          strokeWidth="2"
          strokeDasharray="4 2"
          points={humPts.join(" ")}
          strokeLinejoin="round"
        />

        {stages.map((s, i) => {
          const x0 = padL + ((cumsum[i - 1] || 0) / total) * iw;
          const x1 = padL + (cumsum[i] / total) * iw;
          const xm = (x0 + x1) / 2;
          return (
            <g key={i}>
              <line
                x1={x1}
                x2={x1}
                y1={padT}
                y2={padT + ih + 4}
                stroke="#E8DFCD"
                strokeWidth="0.6"
              />
              <text
                x={xm}
                y={padT + ih + 16}
                fontSize="9"
                fill="#2B2A27"
                textAnchor="middle"
                fontWeight="500"
              >
                {s.name}
              </text>
              <text
                x={xm}
                y={padT + ih + 26}
                fontSize="8"
                fill="#6B655A"
                textAnchor="middle"
              >
                {s.durationHours}h
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-[10px] text-cream-subtext px-2 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-0.5 bg-cheese-500 rounded" /> 温度℃
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-0.5 bg-algae-500 rounded" style={{ borderTop: "1px dashed #4A7C59", background: "transparent", height: 0 }} />
          <span className="inline-block w-5 border-t-2 border-dashed border-algae-500" /> 湿度%
        </span>
        <span>总时长 {total}h = {(total / 24).toFixed(1)}d</span>
      </div>
    </div>
  );
}
