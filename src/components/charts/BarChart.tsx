import type { HoleCategory } from "../../types";
import { HOLE_CATEGORY_LABELS } from "../../types";

interface BarChartProps {
  data: Record<HoleCategory, number>;
  highlight?: HoleCategory | null;
  onHighlight?: (c: HoleCategory | null) => void;
}

const ORDER: HoleCategory[] = ["micro", "small", "medium", "large", "xlarge", "crack"];

const COLORS: Record<HoleCategory, string> = {
  micro: "#B0D2BA",
  small: "#88BC98",
  medium: "#61A576",
  large: "#D0A962",
  xlarge: "#B33951",
  crack: "#CF536F",
};

export default function BarChart({ data, highlight, onHighlight }: BarChartProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...Object.values(data), 1);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3 h-36 mb-2">
        {ORDER.map((c) => {
          const v = data[c] || 0;
          const h = (v / max) * 100;
          const pct = (v / total) * 100;
          const isH = highlight === c;
          const dim = highlight && !isH;
          return (
            <button
              key={c}
              onClick={() => onHighlight?.(isH ? null : c)}
              className="group flex-1 flex flex-col items-center gap-1 outline-none"
            >
              <span
                className={`text-[11px] font-semibold transition-opacity ${
                  dim ? "opacity-30" : "text-cream-text"
                }`}
              >
                {v}
              </span>
              <div className="w-full relative rounded-t-sm overflow-hidden" style={{ height: "100px" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500 ease-out"
                  style={{
                    height: `${Math.max(4, h)}%`,
                    background: COLORS[c],
                    opacity: dim ? 0.35 : isH ? 1 : 0.85,
                    boxShadow: isH ? `0 0 12px ${COLORS[c]}55` : undefined,
                  }}
                />
              </div>
              <span
                className={`text-[11px] font-medium transition-opacity ${
                  dim ? "opacity-30" : "text-cream-subtext"
                }`}
              >
                {HOLE_CATEGORY_LABELS[c]}
              </span>
              <span
                className={`text-[10px] transition-opacity ${
                  dim ? "opacity-20" : "text-cream-subtext/70"
                }`}
              >
                {pct.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-dashed border-cream-border text-[10px] text-cream-subtext">
        <span>共计 {total} 个识别对象</span>
        <span>点击柱形可筛选高亮</span>
      </div>
    </div>
  );
}
