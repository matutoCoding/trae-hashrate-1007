import { NavLink } from "react-router-dom";
import { ClipboardList, Camera, Stethoscope, TrendingUp, Award, Cookie } from "lucide-react";
import { useBatchStore } from "../../hooks/useBatchStore";

const NAV_ITEMS = [
  { to: "/", label: "投料录入", icon: ClipboardList, emoji: "📋" },
  { to: "/imaging", label: "切面成像", icon: Camera, emoji: "📸" },
  { to: "/diagnosis", label: "缺陷诊断", icon: Stethoscope, emoji: "💔" },
  { to: "/trend", label: "趋势预测", icon: TrendingUp, emoji: "📈" },
  { to: "/report", label: "分级报告", icon: Award, emoji: "🏅" },
];

export default function Sidebar() {
  const batch = useBatchStore((s) => s.batch);
  const detected = useBatchStore((s) => s.detected);

  return (
    <aside className="w-[220px] shrink-0 h-screen bg-cream-card border-r border-cream-border flex flex-col sticky top-0">
      <div className="px-5 py-5 border-b border-cream-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg golden-gradient flex items-center justify-center shadow-md shrink-0">
          <Cookie className="w-6 h-6 text-white" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="font-serif text-base font-semibold text-cream-text leading-tight">
            乳测工坊
          </div>
          <div className="text-[10px] text-cream-subtext leading-tight mt-0.5">
            奶酪孔洞质量诊断系统
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <div className="relative">
              <it.icon className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <span className="flex-1">{it.label}</span>
            <span className="text-sm opacity-80">{it.emoji}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-4 p-3 rounded-md bg-cheese-50/60 border border-cheese-100">
        <div className="text-[10px] uppercase tracking-wider text-cheese-700 font-semibold mb-1">
          当前批次
        </div>
        <div className="font-mono text-xs text-cream-text font-semibold truncate">
          {batch.batchNo}
        </div>
        <div className="text-[11px] text-cream-subtext mt-1">
          {batch.cheeseType} · 熟成 {batch.ripeningDays}d
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              detected ? "bg-algae-500 animate-pulse-soft" : "bg-cream-border"
            }`}
          />
          <span className="text-[10px] text-cream-subtext">
            {detected ? "已完成成像识别" : "待录入与成像"}
          </span>
        </div>
      </div>
    </aside>
  );
}
