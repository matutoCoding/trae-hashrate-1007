import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Printer,
  Download,
  QrCode,
  Save,
  ArrowRight,
  RefreshCw,
  PenLine,
  FileText,
  User,
  CalendarDays,
  FileDown,
  Archive,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import RadarChart from "../components/charts/RadarChart";
import CheeseCrossSection from "../components/imaging/CheeseCrossSection";
import type { Grade, RiskLevel } from "../types";
import { riskColor, riskLabel } from "../utils/trendModel";

const GRADE_META: Record<
  Grade,
  { name: string; cls: string; badge: string; sub: string; color: string }
> = {
  A: {
    name: "特级 · A",
    cls: "golden-gradient",
    badge: "bg-yellow-50 text-yellow-800 border-yellow-300",
    sub: "品相卓越，可作顶级礼盒装",
    color: "#B8860B",
  },
  B: {
    name: "优良 · B",
    cls: "silver-gradient",
    badge: "bg-zinc-50 text-zinc-700 border-zinc-300",
    sub: "品相良好，符合市场流通标准",
    color: "#707070",
  },
  C: {
    name: "合格 · C",
    cls: "copper-gradient",
    badge: "bg-orange-50 text-orange-800 border-orange-300",
    sub: "基本合格，建议加工用或降级销售",
    color: "#B87333",
  },
};

export default function ReportPage() {
  const nav = useNavigate();
  const {
    batch,
    holes,
    defects,
    diagnosis,
    report,
    detected,
    generateReport,
    resetBatch,
    image,
    archiveAndNew,
    imageBrightnessSignature,
  } = useBatchStore();

  const [inspector, setInspector] = useState("张师傅");
  const [printing, setPrinting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (detected && !report) {
      generateReport(inspector);
    }
  }, [detected, report, generateReport, inspector]);

  const regen = () => generateReport(inspector);

  if (!report || !diagnosis) {
    return (
      <div className="cheese-card p-12 text-center">
        <Award className="w-12 h-12 mx-auto text-cheese-400 mb-4 opacity-60" />
        <div className="font-serif text-xl text-cream-text mb-2">暂无分级报告</div>
        <div className="text-sm text-cream-subtext mb-6">
          请先完成投料、成像、诊断与趋势预测四步流程
        </div>
        <div className="flex items-center justify-center gap-3">
          <button className="cheese-btn-primary" onClick={() => nav("/")}>
            开始录入新批次
          </button>
          <button
            className="cheese-btn-secondary"
            onClick={() => {
              generateReport(inspector);
            }}
          >
            强制生成报告
          </button>
        </div>
      </div>
    );
  }

  const gm = GRADE_META[report.grade];
  const radar = report.radarScores;
  const d = diagnosis;

  const firstStageTemp = batch.tempHumidityStages[0]?.temperature ?? 14;
  const firstStageHum = batch.tempHumidityStages[0]?.humidity ?? 85;

  const riskLv = useMemo<RiskLevel>(() => {
    if (report.totalScore >= 85) return "green";
    if (report.totalScore >= 70) return "yellow";
    return "orange";
  }, [report.totalScore]);

  const shippingSuggestion = useMemo(() => {
    const { porosityRate, avgDiameter, crackCount, porosityTargetMin, porosityTargetMax, blisterCount } = d;
    if (report.grade === "A" && porosityRate >= porosityTargetMin && porosityRate <= porosityTargetMax && crackCount === 0) {
      return { action: "建议立即出货", detail: "品相卓越，孔洞达标且无结构性缺陷，无需延长熟成，建议分装销售。", tone: "出货" };
    }
    if (porosityRate < porosityTargetMin && avgDiameter < 4) {
      return { action: "建议延长熟成 3-7 天", detail: `孔洞率 ${porosityRate}% 偏低、平均孔径 ${avgDiameter}mm 偏小，丙酸菌产气尚未充分。可置于 ${firstStageTemp + 0.5}℃ / ${firstStageHum}%RH 环境继续熟成观察。`, tone: "继续熟成" };
    }
    if (porosityRate > porosityTargetMax + 3 || blisterCount > 2) {
      return { action: "建议立即出货", detail: `孔洞率已达 ${porosityRate}%${blisterCount > 2 ? "且存在早期皮下胀包" : ""}，若继续熟成有过度发酵与胀包破裂风险，建议尽快分装销售。`, tone: "出货" };
    }
    if (crackCount >= 3) {
      return { action: "建议尽快分装出货", detail: `检出 ${crackCount} 处晚期裂纹结构缺陷，继续熟成可能导致裂纹扩大、风味异常，建议尽快分装或降级为加工用。`, tone: "出货" };
    }
    if (report.grade === "C") {
      return { action: "建议降级出货 / 加工用", detail: "综合品相未达市场流通标准，建议降级为加工用奶酪或内部消化使用。", tone: "降级" };
    }
    return { action: "建议继续观察 3 天", detail: `综合品相尚可（${report.grade}级），可维持当前温湿度条件再观察 3 天，复查孔洞形态后决定出货。`, tone: "观察" };
  }, [d, report.grade, firstStageTemp, firstStageHum]);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const generateThumbnail = (): string => {
    if (image?.dataUrl) return image.dataUrl;
    try {
      const W = 260;
      const svgNS = "http://www.w3.org/2000/svg";
      const root = document.createElementNS(svgNS, "svg");
      root.setAttribute("xmlns", svgNS);
      root.setAttribute("width", String(W));
      root.setAttribute("height", String(W));
      root.setAttribute("viewBox", "0 0 260 260");

      const bg = document.createElementNS(svgNS, "defs");
      bg.innerHTML = `<radialGradient id="tt-cheese" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#F6E3B5"/>
        <stop offset="70%" stop-color="#DDB972"/>
        <stop offset="100%" stop-color="#9E7230"/>
      </radialGradient>`;
      root.appendChild(bg);

      const cx = W / 2;
      const cy = W / 2;
      const rad = W * 0.42;

      const main = document.createElementNS(svgNS, "circle");
      main.setAttribute("cx", String(cx));
      main.setAttribute("cy", String(cy));
      main.setAttribute("r", String(rad));
      main.setAttribute("fill", "url(#tt-cheese)");
      main.setAttribute("stroke", "#9E7230");
      main.setAttribute("stroke-width", "1.5");
      root.appendChild(main);

      const N = Math.min(42, holes.length || 30);
      for (let i = 0; i < N; i++) {
        const h = holes[i];
        const fallback = {
          centerX: 15 + (i * 113) % 70,
          centerY: 12 + (i * 89) % 76,
          diameter: 2 + (i % 6),
          category: "medium" as const,
          isNormal: true,
        };
        const centerX = h ? (h as any).centerX ?? fallback.centerX : fallback.centerX;
        const centerY = h ? (h as any).centerY ?? fallback.centerY : fallback.centerY;
        const diameter = h ? (h as any).diameter ?? fallback.diameter : fallback.diameter;
        const isCrack = h ? (h as any).category === "crack" : false;
        const isBlister = h ? (h as any).isNormal === false && !isCrack && diameter > 10 : false;
        const collapsed = h ? (h as any).circularity !== undefined && (h as any).circularity < 0.3 : false;
        const px = (centerX / 100) * (rad * 2) + (cx - rad);
        const py = (centerY / 100) * (rad * 2) + (cy - rad);
        const rr = Math.max(0.8, (diameter / 22) * rad * 0.28);
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", String(px));
        c.setAttribute("cy", String(py));
        c.setAttribute("r", String(rr));
        c.setAttribute(
          "fill",
          collapsed ? "#6B4025" : isBlister ? "#E8912B99" : "#4A7C5980"
        );
        c.setAttribute("stroke", isCrack ? "#B33951" : "#2D4A34");
        c.setAttribute("stroke-width", isCrack ? "0.7" : "0.35");
        root.appendChild(c);
      }

      const svgStr = new XMLSerializer().serializeToString(root);
      return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
    } catch {
      return "";
    }
  };

  const handleExport = () => {
    const brSign = imageBrightnessSignature
      ? `图像亮度特征值: ${imageBrightnessSignature.toFixed(2)} · 识别seed基准: ${(imageBrightnessSignature * 2 + (d.porosityRate || 0)).toFixed(1)}`
      : "图像亮度特征值: 未启用真实图像识别，基于示例图seed";
    const imgSrcTxt = image
      ? `来源: ${image.source === "upload" ? "本地上传" : "示例图库"} · ${image.fileName || ""} · ${image.width || 0}×${image.height || 0}px · ${(image.fileSize || 0) / 1024 | 0}KB`
      : "来源: 未关联原始切面图";
    const defectTags = defects.slice(0, 6).map((x, i) => `    #${i + 1} [${x.type === "early_blister" ? "早期胀包" : x.type === "late_crack" ? "晚期裂纹" : x.type === "collapsed" ? "孔洞塌陷" : "分布不均"}] 定位(${x.posX.toFixed(1)},${x.posY.toFixed(1)}) 严重度 ${x.label}`).join("\n");
    const acidLevel = batch.pH < 5.4 ? "偏高(促进杂菌抑制)" : batch.pH > 5.8 ? "偏低(需防杂菌)" : "适中";
    const inhibScore = d.contaminationRisk === "green" ? 92 : d.contaminationRisk === "yellow" ? 74 : d.contaminationRisk === "orange" ? 56 : 38;
    const content = `
乳测工坊 · 奶酪孔洞分级质量报告
======================================
【基础信息】
批次编号: ${batch.batchNo}
奶酪品种: ${batch.cheeseType}
生产日期: ${batch.productionDate}
熟成天数: ${batch.ripeningDays} 天
接种菌株: ${batch.strain}
盐度: ${batch.salinity}%   酸度(pH): ${batch.pH} (${acidLevel})
熟成环境: ${firstStageTemp}℃ / ${firstStageHum}%RH
理论产气量: ${batch.theoreticalGas} L   实测产气量: ${batch.measuredGas} L
综合得分: ${report.totalScore} / 100
评定等级: ${report.grade} (${gm.name})  ·  ${gm.sub}
风险等级: ${riskLv.toUpperCase()} (${riskLabel(riskLv)})
签发日期: ${report.issuedAt}
质检人员: ${report.inspector}

======================================
【图像识别摘要】
图像文件: ${imgSrcTxt}
${brSign}
孔洞统计:
  孔洞率: ${d.porosityRate}% (目标区间 ${d.porosityTargetMin}~${d.porosityTargetMax}%)  → ${d.porosityPass ? "达标 ✅" : "未达标 ⚠️"}
  正常气孔数: ${d.normalHoleCount}   裂隙数: ${d.crackCount}   胀包数: ${d.blisterCount}
  平均孔径: ${d.avgDiameter}mm   变异系数(CV): ${(d.cvCoefficient ?? d.avgDiameter * 0.22).toFixed(1)}
  均匀度(Gini): ${d.uniformityScore}/100   盐酸度杂菌抑制: ${inhibScore}/100
  丙酸菌活性指数: ${d.propionibacteriumActivity}/100
  检出缺陷 ${defects.length} 条:
${defectTags || "    (无结构缺陷检出)"}

======================================
【趋势预测结论】
丙酸菌活跃期判断:
  · 第 ${1 + Math.round(d.propionibacteriumActivity / 25)} 阶段(${d.propionibacteriumActivity >= 75 ? "产气峰期" : d.propionibacteriumActivity >= 50 ? "扩张期" : "启动期"})
  · 孔洞形成对应熟成时间: 第 ${Math.max(1, batch.ripeningDays - 10)} 天起开始发育
  · Logistic增长斜率估算: k≈${(0.03 + 0.0008 * (d.propionibacteriumActivity || 60)).toFixed(4)}
熟成延长 7 天预测:
  · 预计孔洞率: ≈${Math.min(35, d.porosityRate + 2.5 + (d.propionibacteriumActivity || 60) * 0.02).toFixed(1)}%
  · 预计平均孔径: ≈${(d.avgDiameter + 0.8).toFixed(1)}mm
  · 胀包风险变化: ${d.blisterCount > 1 ? "🔺 有加剧趋势，需降低 0.5℃" : "➖ 可控"}
  · 裂纹风险变化: ${d.crackCount > 1 ? "🔺 有扩大趋势" : "➖ 可控"}

======================================
【品相雷达得分 (满分100)】
  孔洞率: ${radar.porosity}
  均匀度: ${radar.uniformity}
  正常占比: ${radar.normalRatio}
  无缺陷率: ${radar.defectFree}
  尺寸达标: ${radar.sizeTarget}
  色泽一致: ${radar.color}

======================================
【综合诊断结论】
${report.conclusion}

======================================
【出货 / 熟成决策建议】
★ 决策结论: 【${shippingSuggestion.tone}】${shippingSuggestion.action}
  说明: ${shippingSuggestion.detail}

======================================
【持续改进建议】
${report.suggestions.map((s, i) => `  ${i + 1}. ${s}`).join("\n")}

======================================
本报告由「乳测工坊 · 手工奶酪孔洞质量诊断系统」自动生成
报告编号: RPT-${batch.batchNo}-${report.grade}    签发: ${report.issuedAt}
`.trim();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.batchNo}_奶酪分级报告_含图像摘要.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleArchiveAndNew = async () => {
    if (archiving) return;
    setArchiving(true);
    try {
      const thumb = generateThumbnail();
      await new Promise(r => setTimeout(r, 120));
      archiveAndNew(thumb || undefined);
      setTimeout(() => nav("/history"), 100);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 05 · 分级报告输出
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            奶酪成品质量分级报告
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            基于孔洞品相六维雷达打分评定成品等级（A/B/C），生成可打印、可导出、可归档的正式质检报告。
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="cheese-btn-secondary" onClick={regen}>
            <RefreshCw className="w-4 h-4" />
            刷新评分
          </button>
          <button className="cheese-btn-secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            打印报告
          </button>
          <button className="cheese-btn-secondary" onClick={handleExport}>
            <FileDown className="w-4 h-4" />
            导出 TXT
          </button>
          <button
            className="cheese-btn-secondary"
            onClick={() => {
              if (confirm("确认要丢弃当前批次数据（不归档）并开始新批次吗？")) {
                resetBatch();
                nav("/");
              }
            }}
          >
            <RefreshCw className="w-4 h-4" />
            丢弃·新批次
          </button>
          <button
            className="cheese-btn-primary"
            onClick={handleArchiveAndNew}
            disabled={archiving}
          >
            {archiving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在归档…
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                入档并开启新批次
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </header>

      <div
        id="report-body"
        className={`cheese-card overflow-hidden ${
          printing ? "shadow-2xl" : ""
        }`}
      >
        <div className="bg-cream-surface/70 border-b border-cream-border p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl ${gm.cls} shadow-lg flex items-center justify-center shrink-0`}>
                <Award className="w-8 h-8 text-white/95" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-cheese-600" />
                  <span className="font-serif text-lg font-semibold text-cream-text">
                    手工奶酪孔洞质量分级报告
                  </span>
                </div>
                <div className="text-xs text-cream-subtext font-mono">
                  报告编号 RPT-{batch.batchNo} · 签发于 {report.issuedAt}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-cream-subtext uppercase tracking-wider mb-0.5">
                  综合评分
                </div>
                <div
                  className="font-serif text-4xl font-bold leading-none"
                  style={{ color: gm.color }}
                >
                  {report.totalScore}
                  <span className="text-sm font-normal text-cream-subtext">/100</span>
                </div>
              </div>
              <div
                className={`w-24 h-24 rounded-xl ${gm.cls} shadow-lg flex flex-col items-center justify-center text-white relative`}
              >
                <div className="text-[9px] uppercase tracking-widest opacity-85 mb-0.5">Grade</div>
                <div className="font-serif text-5xl font-bold leading-none drop-shadow-sm">
                  {report.grade}
                </div>
                <div className="text-[9px] opacity-90 mt-0.5">{gm.name.split(" · ")[0]}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-lg border ${gm.badge}`}>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 shrink-0 mt-0.5" style={{ color: gm.color }} />
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: gm.color }}>
                  {gm.name} · {gm.sub}
                </div>
                <div className="text-sm text-cream-text leading-relaxed">{report.conclusion}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 p-4 rounded-md bg-cream-surface/70 border border-cream-border">
              <div className="text-xs font-semibold text-cream-text mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cheese-600" />
                六维品相雷达
              </div>
              <RadarChart scores={radar} size={280} />
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="p-4 rounded-md bg-cream-surface/70 border border-cream-border">
                <div className="text-xs font-semibold text-cream-text mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-cheese-600" />
                  批次信息总览
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 text-sm">
                  {[
                    { k: "批次编号", v: batch.batchNo, mono: true },
                    { k: "奶酪品种", v: batch.cheeseType },
                    { k: "生产日期", v: batch.productionDate },
                    { k: "熟成天数", v: `${batch.ripeningDays} 天` },
                    { k: "接种菌株", v: batch.strain, long: true },
                    { k: "接种量", v: `${batch.inoculation} U/100L` },
                    { k: "理论/实测产气", v: `${batch.theoreticalGas}/${batch.measuredGas} mL` },
                    { k: "盐度/pH/酸度", v: `${batch.salinity}% · ${batch.pH} · ${batch.titratableAcid}°D` },
                  ].map((f, i) => (
                    <div key={i} className={f.long ? "md:col-span-2" : ""}>
                      <div className="text-[10px] uppercase tracking-wider text-cream-subtext mb-0.5">
                        {f.k}
                      </div>
                      <div
                        className={`text-cream-text font-medium truncate ${
                          f.mono ? "font-mono text-xs" : ""
                        }`}
                      >
                        {f.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-md bg-cream-surface/70 border border-cream-border">
                <div className="text-xs font-semibold text-cream-text mb-3 flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5 text-cheese-600" />
                  关键诊断指标
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      k: "孔洞率",
                      v: `${d.porosityRate}%`,
                      s: d.porosityPass ? "达标" : "未达标",
                      ok: d.porosityPass,
                    },
                    {
                      k: "丙酸菌活性",
                      v: `${d.propionibacteriumActivity}`,
                      s: d.propionibacteriumActivity >= 50 ? "正常" : "偏弱",
                      ok: d.propionibacteriumActivity >= 50,
                    },
                    { k: "平均孔径", v: `${d.avgDiameter} mm`, s: "参考 12mm", ok: true },
                    {
                      k: "均匀度",
                      v: `${d.uniformityScore}`,
                      s: d.uniformityScore >= 75 ? "良好" : "偏差",
                      ok: d.uniformityScore >= 75,
                    },
                    { k: "正常气孔", v: `${d.normalHoleCount}`, s: "个", ok: true },
                    { k: "裂隙条数", v: `${d.crackCount}`, s: "条", ok: d.crackCount === 0 },
                    { k: "胀包缺陷", v: `${d.blisterCount}`, s: "处", ok: d.blisterCount === 0 },
                    {
                      k: "杂菌产气风险",
                      v: (
                        { green: "安全", yellow: "注意", orange: "告警", red: "危险" } as Record<string, string>
                      )[d.contaminationRisk],
                      s: "等级",
                      ok: d.contaminationRisk === "green" || d.contaminationRisk === "yellow",
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-md border border-cream-border/80 bg-cream-card/60"
                    >
                      <div className="text-[10px] text-cream-subtext mb-0.5">{m.k}</div>
                      <div className="flex items-end justify-between">
                        <span className="font-serif text-lg font-bold text-cream-text">{m.v}</span>
                        <span
                          className={`badge text-[9px] ${
                            m.ok ? "bg-algae-100 text-algae-700" : "bg-wine-100 text-wine-700"
                          }`}
                        >
                          {m.s}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-md bg-algae-50/60 border border-algae-200">
              <div className="text-xs font-semibold text-algae-700 mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                工艺保持与改进建议
              </div>
              <ol className="space-y-2">
                {report.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-cream-text leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-algae-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-md bg-cream-surface/70 border border-cream-border">
                <div className="text-xs font-semibold text-cream-text mb-3 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-cheese-600" />
                  溯源二维码与入档
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-md border border-cream-border bg-cream-card p-1.5 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {Array.from({ length: 13 * 13 }).map((_, i) => {
                        const x = (i % 13) * 7 + 9;
                        const y = Math.floor(i / 13) * 7 + 9;
                        const on = ((i * 37 + batch.batchNo.charCodeAt(6) + i) % 5) < 2;
                        if (
                          (i % 13 < 3 && Math.floor(i / 13) < 3) ||
                          (i % 13 >= 10 && Math.floor(i / 13) < 3) ||
                          (i % 13 < 3 && Math.floor(i / 13) >= 10)
                        ) {
                          const cx = (i % 13) * 7 + 9 + 3.5;
                          const cy = Math.floor(i / 13) * 7 + 9 + 3.5;
                          return (
                            <rect
                              key={i}
                              x={cx - 4.5}
                              y={cy - 4.5}
                              width="9"
                              height="9"
                              fill="#C9A66B"
                              opacity={
                                (i % 13 === 1 && Math.floor(i / 13) === 1) ||
                                (i % 13 === 11 && Math.floor(i / 13) === 1) ||
                                (i % 13 === 1 && Math.floor(i / 13) === 11)
                                  ? 0.2
                                  : 1
                              }
                            />
                          );
                        }
                        return on ? (
                          <rect key={i} x={x} y={y} width="6" height="6" fill="#2B2A27" rx="0.5" />
                        ) : null;
                      })}
                    </svg>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-[11px] text-cream-subtext leading-relaxed">
                      扫码可查询：投料记录、孔洞演变影像、诊断详情、分级评分明细。
                      <br />
                      本批次已关联 <b>{MOCK_FILTER(holes).length}</b> 个孔洞识别记录与{" "}
                      <b>{defects.length}</b> 条缺陷标注。
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-cream-subtext">
                        <User className="w-3 h-3" />
                        质检：
                      </div>
                      <input
                        value={inspector}
                        onChange={(e) => setInspector(e.target.value)}
                        className="px-2 py-0.5 text-xs border border-cream-border rounded bg-cream-card focus:outline-none focus:border-cheese-400 w-28"
                      />
                      <span className="text-cream-subtext ml-2">·</span>
                      <span className="text-cream-subtext ml-1">
                        签发 {report.issuedAt.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-md border border-dashed border-cheese-400 bg-cheese-50/40">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-cheese-700 font-semibold mb-1">
                      质检签名 / 主管确认
                    </div>
                    <div className="font-serif text-cheese-800 italic">
                      {inspector} __________________
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-20 h-12 rounded golden-gradient opacity-70 flex items-center justify-center text-white font-serif text-xs rotate-[-8deg] shadow-md">
                      质检专用章
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream-border px-6 py-3 flex items-center justify-between text-[11px] text-cream-subtext bg-cream-surface/50">
          <span>© 乳测工坊 · 奶酪孔洞质量诊断系统 V1.0</span>
          <span className="font-mono">RPT-{batch.batchNo}-{report.grade}</span>
          <span>本报告共 1 页 · 系统自动生成</span>
        </div>
      </div>

      <footer className="flex items-center justify-between pt-2 pb-4 text-xs text-cream-subtext">
        <span>💡 本报告已完成六维综合评分，可直接用于批次入档与销售定级参考。</span>
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5" />
          支持导出 PDF / TXT / 图谱库归档
        </div>
      </footer>
    </div>
  );
}

function MOCK_FILTER(holes: unknown[]) {
  return holes as unknown[];
}
