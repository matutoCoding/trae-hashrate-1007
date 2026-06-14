import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import RadarChart from "../components/charts/RadarChart";
import type { Grade } from "../types";

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
  const { batch, holes, defects, diagnosis, report, detected, generateReport, resetBatch } =
    useBatchStore();

  const [inspector, setInspector] = useState("张师傅");
  const [printing, setPrinting] = useState(false);

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

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const handleExport = () => {
    const content = `
乳测工坊 · 奶酪孔洞分级质量报告
======================================
批次编号: ${batch.batchNo}
奶酪品种: ${batch.cheeseType}
生产日期: ${batch.productionDate}
熟成天数: ${batch.ripeningDays} 天
接种菌株: ${batch.strain}
综合得分: ${report.totalScore} / 100
评定等级: ${report.grade} (${gm.name})
签发日期: ${report.issuedAt}
质检人员: ${report.inspector}
--------------------------------------
关键指标
  孔洞率: ${d.porosityRate}% (目标 ${d.porosityTargetMin}~${d.porosityTargetMax}%) ${d.porosityPass ? "达标" : "未达标"}
  丙酸菌活性: ${d.propionibacteriumActivity}
  正常气孔数: ${d.normalHoleCount}
  裂隙数: ${d.crackCount}
  胀包数: ${d.blisterCount}
  平均孔径: ${d.avgDiameter}mm
  均匀度: ${d.uniformityScore}分
--------------------------------------
品相雷达得分
  孔洞率: ${radar.porosity}
  均匀度: ${radar.uniformity}
  正常占比: ${radar.normalRatio}
  无缺陷率: ${radar.defectFree}
  尺寸达标: ${radar.sizeTarget}
  色泽一致: ${radar.color}
--------------------------------------
诊断结论
${report.conclusion}
--------------------------------------
改进建议
${report.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
======================================
`.trim();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.batchNo}_奶酪分级报告.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="cheese-btn-primary"
            onClick={() => {
              resetBatch();
              nav("/");
            }}
          >
            <Save className="w-4 h-4" />
            入档并开启新批次
            <ArrowRight className="w-4 h-4" />
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
