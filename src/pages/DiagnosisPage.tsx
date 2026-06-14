import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  AlertTriangle,
  Bug,
  Droplets,
  BookOpen,
  ArrowRight,
  Sparkles,
  Activity,
  ThermometerSun,
  Search,
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import GaugeChart from "../components/charts/GaugeChart";
import CheeseCrossSection from "../components/imaging/CheeseCrossSection";
import { MOCK_SPECTRUM } from "../utils/mockData";
import { riskColor, riskLabel } from "../utils/trendModel";

export default function DiagnosisPage() {
  const nav = useNavigate();
  const { batch, holes, defects, diagnosis, computeAllDiagnosis, detected } = useBatchStore();

  const d = diagnosis;

  useMemo(() => {
    if (detected && !d) computeAllDiagnosis();
  }, [detected, d, computeAllDiagnosis]);

  const activityColor =
    !d ? "#999" : d.propionibacteriumActivity >= 75 ? "#4A7C59" : d.propionibacteriumActivity >= 50 ? "#C9A66B" : "#B33951";

  const heatGrid = (() => {
    const rows = 5;
    const cols = 5;
    const grid: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const sFactor = Math.min(1, batch.salinity / 2);
        const pFactor = Math.max(0, Math.min(1, (5.8 - batch.pH) / 1.3));
        const tFactor = Math.min(1, batch.titratableAcid / 20);
        const base = (sFactor * 0.4 + pFactor * 0.35 + tFactor * 0.25);
        const noise = ((r * 7 + c * 13) % 100) / 100 * 0.2 - 0.1;
        row.push(Math.max(0, Math.min(1, base + noise)));
      }
      grid.push(row);
    }
    return grid;
  })();

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 03 · 智能缺陷诊断
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">💔</span>
            孔洞缺陷诊断与活性评估
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            综合孔洞率、结构缺陷类型、丙酸菌活性指数与盐酸度抑制矩阵，为当前批次提供全面的发酵质量诊断。
          </p>
        </div>
        <button
          className="cheese-btn-primary"
          onClick={() => nav("/trend")}
        >
          进入趋势预测
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {!d ? (
        <div className="cheese-card p-12 text-center">
          <Stethoscope className="w-12 h-12 mx-auto text-cheese-400 mb-4 opacity-60" />
          <div className="font-serif text-xl text-cream-text mb-2">暂无诊断数据</div>
          <div className="text-sm text-cream-subtext mb-6">
            请先完成「投料录入」与「切面成像」的孔洞识别
          </div>
          <button className="cheese-btn-primary" onClick={() => nav("/")}>
            前往录入页面
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section className="lg:col-span-2 cheese-card p-6">
              <div className="section-title">
                <Activity className="w-5 h-5 text-algae-600" />
                孔洞率仪表盘
              </div>
              <GaugeChart
                value={d.porosityRate}
                min={0}
                max={40}
                targetMin={d.porosityTargetMin}
                targetMax={d.porosityTargetMax}
                label="实测孔洞率"
                unit="%"
              />
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-cream-border">
                <div className="text-center">
                  <div className="text-[10px] text-cream-subtext">实测值</div>
                  <div className="font-mono font-bold text-cheese-700 text-lg">{d.porosityRate}%</div>
                </div>
                <div className="text-center border-x border-cream-border">
                  <div className="text-[10px] text-cream-subtext">目标下限</div>
                  <div className="font-mono font-bold text-algae-700 text-lg">{d.porosityTargetMin}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-cream-subtext">目标上限</div>
                  <div className="font-mono font-bold text-wine-600 text-lg">{d.porosityTargetMax}%</div>
                </div>
              </div>
            </section>

            <section className="lg:col-span-3 cheese-card p-6">
              <div className="section-title">
                <AlertTriangle className="w-5 h-5 text-wine-500" />
                结构缺陷识别面板
                <span className="ml-auto text-xs font-normal text-cream-subtext">
                  胀包 {d.blisterCount} 处 · 裂纹 {d.crackCount} 处
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  <CheeseCrossSection
                    holes={holes}
                    defects={defects}
                    size={360}
                  />
                </div>
                <div className="space-y-3">
                  {defects.length === 0 ? (
                    <div className="p-6 rounded-md bg-algae-50 border border-algae-200 text-center">
                      <Sparkles className="w-7 h-7 mx-auto text-algae-600 mb-2" />
                      <div className="text-sm font-semibold text-algae-700">未检出结构性缺陷 ✓</div>
                      <div className="text-[11px] text-algae-600 mt-1">切面品相良好，无明显胀包与裂纹</div>
                    </div>
                  ) : (
                    defects.map((de, i) => (
                      <div
                        key={de.id}
                        className={`p-3 rounded-md border flex items-start gap-3 ${
                          de.type === "early_blister"
                            ? "bg-[#FFF9E8] border-[#E8C36A]"
                            : "bg-wine-50 border-wine-200"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 text-white text-sm font-bold ${
                            de.type === "early_blister" ? "bg-[#D4A017]" : "bg-wine-500"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-cream-text">{de.label}</div>
                            <span
                              className={`badge ${
                                de.severity === "severe"
                                  ? "bg-wine-200 text-wine-700"
                                  : de.severity === "medium"
                                  ? "bg-cheese-200 text-cheese-800"
                                  : "bg-algae-100 text-algae-700"
                              }`}
                            >
                              {de.severity === "severe" ? "严重" : de.severity === "medium" ? "中度" : "轻微"}
                            </span>
                          </div>
                          <div className="text-[11px] text-cream-subtext mt-1">
                            位置：({(de.posX * 100).toFixed(0)}%, {(de.posY * 100).toFixed(0)}%) · 尺寸：{de.size}mm
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-3 rounded-md bg-cream-surface/80 border border-cream-border space-y-1.5">
                    <div className="text-xs font-semibold text-cream-text mb-1">缺陷占比速览</div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 text-cream-subtext">正常气孔</span>
                      <div className="flex-1 h-2 rounded-full bg-cream-border overflow-hidden">
                        <div className="h-full bg-algae-500 rounded-full" style={{ width: `${Math.min(100, (d.normalHoleCount / holes.length) * 100)}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono text-algae-700 font-semibold">{holes.length ? ((d.normalHoleCount / holes.length) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 text-cream-subtext">裂隙缝隙</span>
                      <div className="flex-1 h-2 rounded-full bg-cream-border overflow-hidden">
                        <div className="h-full bg-wine-500 rounded-full" style={{ width: `${Math.min(100, (d.crackCount / Math.max(1, holes.length)) * 100)}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono text-wine-600 font-semibold">{d.crackCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 text-cream-subtext">胀包缺陷</span>
                      <div className="flex-1 h-2 rounded-full bg-cream-border overflow-hidden">
                        <div className="h-full bg-[#D4A017] rounded-full" style={{ width: `${Math.min(100, d.blisterCount * 18)}%` }} />
                      </div>
                      <span className="w-12 text-right font-mono text-[#B88A2E] font-semibold">{d.blisterCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="cheese-card p-6">
              <div className="section-title">
                <Bug className="w-5 h-5 text-algae-600" />
                丙酸菌活性指数
                <span className="ml-auto text-xs font-normal text-cream-subtext">
                  产气量 × 0.4 + 正常孔比 × 0.3 + 孔径达标 × 0.3
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 160 160" className="w-full h-full">
                    <circle cx="80" cy="80" r="68" fill="none" stroke="#E8DFCD" strokeWidth="14" />
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      fill="none"
                      stroke={activityColor}
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${(d.propionibacteriumActivity / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
                      transform="rotate(-90 80 80)"
                      style={{ transition: "stroke-dasharray 0.8s ease-out" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-serif text-4xl font-bold" style={{ color: activityColor }}>
                      {d.propionibacteriumActivity}
                    </div>
                    <div className="text-[10px] text-cream-subtext">Activity Index</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className={`inline-flex items-center gap-1.5 badge mb-3 ${
                      d.propionibacteriumActivity >= 75
                        ? "bg-algae-100 text-algae-700"
                        : d.propionibacteriumActivity >= 50
                        ? "bg-cheese-100 text-cheese-800"
                        : "bg-wine-100 text-wine-700"
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    {d.propionibacteriumActivity >= 75
                      ? "活性优异"
                      : d.propionibacteriumActivity >= 50
                      ? "活性正常"
                      : d.propionibacteriumActivity >= 30
                      ? "活性偏低"
                      : "活性不足"}
                  </div>
                  <div className="text-xs text-cream-subtext mb-3">
                    对应孔洞形成四阶段时间轴映射
                  </div>
                  <div className="space-y-2">
                    {[
                      { k: "接种·停滞期", v: d.holeTimeMapping.inoculationDay, color: "bg-cheese-200 text-cheese-800" },
                      { k: "启孔·对数期", v: d.holeTimeMapping.startDay, color: "bg-algae-200 text-algae-700" },
                      { k: "扩孔·平台期", v: d.holeTimeMapping.expansionDay, color: "bg-[#EAD8B3] text-cheese-800" },
                      { k: "稳定·衰亡期", v: d.holeTimeMapping.stableDay, color: "bg-cream-border text-cream-text" },
                    ].map((st) => (
                      <div key={st.k} className="flex items-center gap-3 text-xs">
                        <span className={`w-20 shrink-0 badge ${st.color}`}>{st.k}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-cream-border overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (st.v / Math.max(batch.ripeningDays, 1)) * 100)}%`,
                              background: activityColor,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                        <span className="font-mono w-14 text-right font-semibold text-cream-text">
                          Day {st.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="cheese-card p-6">
              <div className="section-title">
                <Droplets className="w-5 h-5 text-cheese-600" />
                盐酸度 · 杂菌产气抑制矩阵
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="text-[11px] text-cream-subtext mb-2">盐度 × 酸度 · 风险热力图</div>
                  <div className="inline-block p-2 rounded-md bg-cream-surface/80 border border-cream-border">
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                      {heatGrid.map((row, ri) =>
                        row.map((v, ci) => (
                          <div
                            key={`${ri}-${ci}`}
                            className="w-8 h-8 rounded-sm"
                            style={{
                              background:
                                v > 0.7
                                  ? "#4A7C59"
                                  : v > 0.5
                                  ? "#88BC98"
                                  : v > 0.3
                                  ? "#DDC18A"
                                  : v > 0.15
                                  ? "#D4742A"
                                  : "#B33951",
                              opacity: 0.8,
                            }}
                            title={`抑制能力: ${(v * 100).toFixed(0)}%`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-cream-subtext">
                    <span>危险</span>
                    <span className="flex items-center gap-0.5">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#B33951" }} />
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#D4742A" }} />
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#DDC18A" }} />
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#88BC98" }} />
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#4A7C59" }} />
                    </span>
                    <span>安全</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-md border ${
                      d.contaminationRisk === "green"
                        ? "bg-algae-50 border-algae-200"
                        : d.contaminationRisk === "yellow"
                        ? "bg-cheese-50 border-cheese-300"
                        : d.contaminationRisk === "orange"
                        ? "bg-[#FFF4E8] border-[#E8A86A]"
                        : "bg-wine-50 border-wine-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: riskColor(d.contaminationRisk) }}
                      />
                      <div className="text-sm font-semibold text-cream-text">
                        杂菌产气风险：<span style={{ color: riskColor(d.contaminationRisk) }}>{riskLabel(d.contaminationRisk)}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-cream-subtext">
                      盐度 {batch.salinity}% · pH {batch.pH} · 滴定酸度 {batch.titratableAcid}°D
                    </div>
                  </div>
                  <div className="p-3 rounded-md bg-cream-surface/70 border border-cream-border space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">盐度 {batch.salinity < 1.5 ? "⚠" : "✓"}</span>
                      <span className={`font-mono font-semibold ${batch.salinity >= 1.5 ? "text-algae-700" : "text-wine-600"}`}>
                        {batch.salinity}% {batch.salinity >= 1.5 ? "达标" : "偏低"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">pH {batch.pH > 5.4 ? "⚠" : "✓"}</span>
                      <span className={`font-mono font-semibold ${batch.pH <= 5.4 ? "text-algae-700" : "text-wine-600"}`}>
                        {batch.pH} {batch.pH <= 5.4 ? "合格" : "偏高"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">滴定酸度 {batch.titratableAcid < 14 ? "⚠" : "✓"}</span>
                      <span className={`font-mono font-semibold ${batch.titratableAcid >= 14 ? "text-algae-700" : "text-wine-600"}`}>
                        {batch.titratableAcid}°D {batch.titratableAcid >= 14 ? "达标" : "不足"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="cheese-card p-6">
            <div className="section-title">
              <BookOpen className="w-5 h-5 text-cheese-700" />
              缺陷图谱库 · 历史相似缺陷对比
              <span className="ml-auto text-xs font-normal text-cream-subtext flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                点击缩略图放大对比
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              {MOCK_SPECTRUM.map((sp) => (
                <div
                  key={sp.id}
                  className="group cursor-pointer p-3 rounded-md border border-cream-border bg-cream-surface/80 hover:border-cheese-400 hover:shadow-cardHover transition-all"
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-2 border border-cream-border/70 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <radialGradient id={`sp-${sp.id}`} cx="50%" cy="45%" r="60%">
                          <stop offset="0%" stopColor="#F6E3B5" />
                          <stop offset="70%" stopColor="#DDB972" />
                          <stop offset="100%" stopColor="#9E7230" />
                        </radialGradient>
                      </defs>
                      <circle cx="50" cy="50" r="44" fill={`url(#sp-${sp.id})`} stroke="#9E7230" strokeWidth="0.8" />
                      {Array.from({ length: 18 }).map((_, i) => {
                        const seed = (i * 53 + sp.id.charCodeAt(1)) % 100;
                        const cx = 15 + (seed * 0.7);
                        const cy = 12 + ((seed * 37) % 76);
                        const tagWeight = sp.defectTags.includes("late_crack") ? 0.6 : 1;
                        const blisterWeight = sp.defectTags.includes("early_blister") ? 1.5 : 1;
                        const uneven = sp.defectTags.includes("uneven") ? (i < 12 ? 1.8 : 0.3) : 1;
                        const r = (1 + (seed % 7) * 0.6) * tagWeight * blisterWeight * uneven;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={Math.min(8, r)}
                            fill={sp.defectTags.includes("collapsed") ? "#6B4025" : "#4A7C5955"}
                            stroke={tagWeight < 1 ? "#B33951" : "#2D4A34"}
                            strokeWidth={tagWeight < 1 ? 0.6 : 0.3}
                          />
                        );
                      })}
                    </svg>
                    <div
                      className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                        sp.grade === "A"
                          ? "golden-gradient"
                          : sp.grade === "B"
                          ? "silver-gradient"
                          : "copper-gradient"
                      }`}
                    >
                      {sp.grade}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-cream-text mb-1 truncate">{sp.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {sp.defectTags.length === 0 ? (
                      <span className="badge bg-algae-100 text-algae-700 text-[9px]">无缺陷</span>
                    ) : (
                      sp.defectTags.map((t) => (
                        <span
                          key={t}
                          className={`badge text-[9px] ${
                            t === "early_blister"
                              ? "bg-cheese-100 text-cheese-800"
                              : t === "late_crack"
                              ? "bg-wine-100 text-wine-700"
                              : t === "uneven"
                              ? "bg-[#EAD8B3] text-cheese-800"
                              : "bg-wine-100 text-wine-700"
                          }`}
                        >
                          {t === "early_blister" ? "胀包" : t === "late_crack" ? "裂纹" : t === "uneven" ? "不均" : "塌陷"}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
