import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  Trash2,
  Download,
  Calendar,
  Award,
  Circle,
  Hexagon,
  Grid3x3,
  Thermometer,
  FolderOpen,
  X,
  Activity,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { useBatchStore, buildSpectrumFromArchive } from "../hooks/useBatchStore";
import type { ArchivedBatch, RiskLevel, Grade } from "../types";
import { riskColor, riskLabel } from "../utils/trendModel";
import CheeseCrossSection from "../components/imaging/CheeseCrossSection";
import RadarChart from "../components/charts/RadarChart";
import GaugeChart from "../components/charts/GaugeChart";

const gradeColor: Record<Grade, string> = {
  A: "#D4A84B",
  B: "#9AA0A6",
  C: "#B87333",
};

export default function HistoryPage() {
  const nav = useNavigate();
  const { archive, loadArchived, deleteArchived, getArchivedById } = useBatchStore();
  const [detail, setDetail] = useState<ArchivedBatch | null>(null);
  const [tab, setTab] = useState<"summary" | "imaging" | "report">("summary");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const spectrum = useMemo(() => buildSpectrumFromArchive(archive), [archive]);

  const doOpen = (id: string) => {
    const a = getArchivedById(id);
    if (a) setDetail(a);
  };

  const doLoad = (a: ArchivedBatch) => {
    loadArchived(a.id);
    nav("/input");
  };

  const doDelete = (id: string) => {
    if (confirmDel === id) {
      deleteArchived(id);
      setConfirmDel(null);
      if (detail?.id === id) setDetail(null);
    } else {
      setConfirmDel(id);
      setTimeout(() => setConfirmDel(null), 5000);
    }
  };

  const exportArchivedTxt = (a: ArchivedBatch) => {
    const d = a.diagnosis;
    const r = a.report;
    const rad = r.radarScores;
    const riskLv: RiskLevel = d.contaminationRisk;
    const advice = d.porosityPass && d.crackCount === 0 && r.grade === "A"
      ? "建议出货：孔洞品相达标，结构稳定，适合出厂。"
      : d.porosityRate < d.porosityTargetMin
        ? "建议延长熟成 3-7 天：孔洞率未达下限，丙酸菌仍有产气空间。"
        : d.porosityRate > d.porosityTargetMax
          ? "建议立即出货或降级：孔洞率已超标，继续熟成可能塌陷或过度发酵。"
          : d.crackCount > 2
            ? "建议尽快切割分装：晚期裂纹已形成，延长熟成会加重破损。"
            : "建议继续熟成 3 天观察：品相接近合格线，轻微延长可提升均匀度。";
    const content = `
==========================================================================
  乳测工坊 · 历史批次归档报告
  归档编号: ${a.id}
  归档时间: ${a.archivedAt}
==========================================================================
批次信息
  批次号: ${a.batch.batchNo}
  奶酪品种: ${a.batch.cheeseType}
  生产日期: ${a.batch.productionDate}
  熟成天数: ${a.batch.ripeningDays}d
  接种菌株: ${a.batch.strain}
  实测产气量: ${a.batch.measuredGas}mL / 理论 ${a.batch.theoreticalGas}mL/100g
  盐度: ${a.batch.salinity}%  pH: ${a.batch.pH}  滴定酸度: ${a.batch.titratableAcid}°D
==========================================================================
图像识别摘要
  识别来源: ${a.image?.source === "upload" ? "本地上传" : a.image?.source === "sample" ? "示例图" : "未记录图像"}
${a.image ? `  文件: ${a.image.fileName} (${a.image.width}x${a.image.height})\n  上传时间: ${a.image.uploadedAt}` : "  文件: 无图像记录"}
  孔洞总数: ${a.holes.length} 个
  正常气孔: ${d.normalHoleCount} 个
  裂隙条数: ${d.crackCount} 条
  平均孔径: ${d.avgDiameter}mm
  均匀度: ${d.uniformityScore}分 / CV=${d.cvCoefficient}%
==========================================================================
孔洞率仪表盘
  当前孔洞率: ${d.porosityRate}%
  目标区间: ${d.porosityTargetMin}% ~ ${d.porosityTargetMax}%
  达标判定: ${d.porosityPass ? "达标 ✓" : "未达标 ✗"}
  丙酸菌活性指数: ${d.propionibacteriumActivity} / 100
  杂菌产气风险: ${riskLabel(riskLv)} (${riskLv.toUpperCase()})
==========================================================================
趋势预测结论
  启孔阶段: 第 ${d.holeTimeMapping.startDay} 天
  扩孔阶段: 第 ${d.holeTimeMapping.expansionDay} 天
  稳定阶段: 第 ${d.holeTimeMapping.stableDay} 天
  胀包数: ${d.blisterCount}
  早期胀包告警: ${d.blisterCount > 0 ? "存在早期皮下气泡，需追溯压制阶段压力" : "无胀包 ✓"}
==========================================================================
品相雷达得分
  孔洞率: ${rad.porosity}
  均匀度: ${rad.uniformity}
  正常占比: ${rad.normalRatio}
  无缺陷率: ${rad.defectFree}
  尺寸达标: ${rad.sizeTarget}
  色泽一致: ${rad.color}
==========================================================================
质量分级
  综合得分: ${r.totalScore.toFixed(1)}
  成品等级: ${r.grade} (${r.grade === "A" ? "特级" : r.grade === "B" ? "优级" : "合格品"})
  质检员: ${r.inspector}
  签发时间: ${r.issuedAt}
--------------------------------------
诊断结论
${r.conclusion}
--------------------------------------
出货 / 熟成判断
  ${advice}
--------------------------------------
改进建议
${r.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
==========================================================================
`.trim();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${a.batch.batchNo}_历史归档报告.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const gradeBadge = (g: Grade) => (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold text-white inline-flex items-center gap-1 ${
        g === "A" ? "golden-gradient" : g === "B" ? "silver-gradient" : "copper-gradient"
      }`}
    >
      <Award className="w-3 h-3" />
      {g}级
    </span>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 06 · 历史批次档案库
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">🗂️</span>
            历史批次档案与缺陷图谱库
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            查看所有已归档的批次记录，可回溯加载入报告、孔洞统计与切面演变图。缺陷图谱卡片从已归档批次中自动累积生成。
          </p>
        </div>
        <button className="cheese-btn-secondary" onClick={() => nav("/input")}>
          <ArrowLeft className="w-4 h-4" />
          返回录入页
        </button>
      </header>

      <section className="cheese-card p-6">
        <div className="section-title">
          <Archive className="w-5 h-5 text-cheese-600" />
          已归档批次 ({archive.length})
          <span className="ml-auto text-xs font-normal text-cream-subtext">
            图谱卡片数：{spectrum.length}
          </span>
        </div>
        {archive.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-cream-subtext bg-cream-surface/60 rounded-md border border-dashed border-cream-border">
            <Archive className="w-12 h-12 mb-2 opacity-40" />
            <div className="text-sm">暂无已归档批次</div>
            <div className="text-xs mt-1">在分级报告页点击「入档并开启新批次」即可在此归档</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...archive].reverse().map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-md border border-cream-border bg-cream-surface/70 hover:border-cheese-400 hover:shadow-cardHover transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => doOpen(a.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-mono text-xs font-semibold text-cheese-700 truncate">
                      {a.batch.batchNo}
                    </div>
                    <div className="text-[11px] text-cream-subtext truncate">
                      {a.batch.cheeseType} · 熟成{a.batch.ripeningDays}d
                    </div>
                  </button>
                  {gradeBadge(a.report.grade)}
                </div>

                <div className="aspect-square rounded-md overflow-hidden border border-cream-border/80 mb-3 bg-cream-surface relative">
                  {a.thumbnailData ? (
                    <img
                      src={a.thumbnailData}
                      alt="切面缩略"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cream-subtext text-[11px]">
                      <FolderOpen className="w-6 h-6 mr-1 opacity-40" />
                      无缩略图
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-cream-card/90 text-cream-text border border-cream-border">
                    {a.holes.length}孔 · 孔率{a.diagnosis.porosityRate}%
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 text-[11px] text-cream-subtext">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="truncate">{a.archivedAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Circle className="w-3 h-3 shrink-0 text-algae-600" />
                    正常孔 <b className="text-cream-text">{d_normal(a)}</b>
                    <span className="mx-1 text-cream-border">·</span>
                    <Hexagon className="w-3 h-3 shrink-0 text-wine-500" />
                    裂隙 <b className="text-cream-text">{a.diagnosis.crackCount}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Grid3x3 className="w-3 h-3 shrink-0 text-cheese-600" />
                    均匀 <b className="text-cream-text">{a.diagnosis.uniformityScore}</b>
                    <span className="mx-1 text-cream-border">·</span>
                    <Activity className="w-3 h-3 shrink-0" style={{ color: riskColor(a.diagnosis.contaminationRisk) }} />
                    杂菌 <b style={{ color: riskColor(a.diagnosis.contaminationRisk) }}>{riskLabel(a.diagnosis.contaminationRisk)}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-cheese-600" />
                    胀包 <b className="text-cream-text">{a.diagnosis.blisterCount}</b>
                    <span className="mx-1 text-cream-border">·</span>
                    <Thermometer className="w-3 h-3 shrink-0 text-algae-600" />
                    活性 <b className="text-cream-text">{a.diagnosis.propionibacteriumActivity}</b>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-cream-border/80">
                  <button
                    onClick={() => doOpen(a.id)}
                    className="flex-1 text-[11px] px-2 py-1.5 rounded bg-cheese-50 hover:bg-cheese-100 border border-cheese-200 text-cheese-700 font-medium transition-colors"
                  >
                    <FolderOpen className="w-3 h-3 inline mr-1" />
                    详情
                  </button>
                  <button
                    onClick={() => exportArchivedTxt(a)}
                    className="text-[11px] px-2 py-1.5 rounded bg-algae-50 hover:bg-algae-100 border border-algae-200 text-algae-700 font-medium transition-colors"
                    title="导出归档报告TXT"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => doLoad(a)}
                    className="text-[11px] px-2 py-1.5 rounded bg-[#FFF4E8] hover:bg-[#FFE9CC] border border-[#E8A86A]/60 text-[#8A5A1B] font-medium transition-colors"
                    title="加载此批次到当前工作区"
                  >
                    <Printer className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => doDelete(a.id)}
                    className={`text-[11px] px-2 py-1.5 rounded font-medium transition-colors ${
                      confirmDel === a.id
                        ? "bg-wine-100 border border-wine-300 text-wine-700"
                        : "bg-cream-surface border border-cream-border text-cream-subtext hover:text-wine-600 hover:border-wine-300"
                    }`}
                    title={confirmDel === a.id ? "再次点击确认删除" : "删除归档"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 bg-cream-text/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cream-card rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-cream-border">
            <div className="px-6 py-4 border-b border-cream-border flex items-center gap-3">
              <Archive className="w-5 h-5 text-cheese-600" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-cheese-700 truncate">
                  {detail.batch.batchNo}
                </div>
                <div className="text-[11px] text-cream-subtext">
                  {detail.batch.cheeseType} · 归档于 {detail.archivedAt}
                </div>
              </div>
              {gradeBadge(detail.report.grade)}
              <button
                onClick={() => setDetail(null)}
                className="w-8 h-8 rounded-full border border-cream-border flex items-center justify-center text-cream-subtext hover:text-wine-600 hover:border-wine-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-2 border-b border-cream-border flex gap-1.5">
              {(
                [
                  { k: "summary", label: "📋 信息总览" },
                  { k: "imaging", label: "📸 孔洞成像" },
                  { k: "report", label: "🏅 分级报告" },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    tab === t.k
                      ? "bg-cheese-100 text-cheese-800 border border-cheese-300 shadow-sm"
                      : "text-cream-subtext hover:bg-cream-surface border border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto">
              {tab === "summary" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <section className="cheese-card p-5 md:col-span-2">
                    <div className="section-title mb-3">
                      <Circle className="w-4 h-4 text-algae-600" />
                      批次与诊断指标
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        ["批次号", detail.batch.batchNo],
                        ["品种 / 生产日期", `${detail.batch.cheeseType} · ${detail.batch.productionDate}`],
                        ["熟成天数 / 接种量", `${detail.batch.ripeningDays}天 / ${detail.batch.inoculation}U`],
                        ["丙酸菌菌株", detail.batch.strain],
                        ["实测 / 理论产气量", `${detail.batch.measuredGas} / ${detail.batch.theoreticalGas} mL`],
                        ["盐度 / pH / 酸度", `${detail.batch.salinity}% · ${detail.batch.pH} · ${detail.batch.titratableAcid}°D`],
                        ["孔洞率", `${detail.diagnosis.porosityRate}% (目标 ${detail.diagnosis.porosityTargetMin}-${detail.diagnosis.porosityTargetMax}%) ${detail.diagnosis.porosityPass ? "✓" : "✗"}`],
                        ["丙酸菌活性指数", detail.diagnosis.propionibacteriumActivity + " / 100"],
                        ["孔洞总数 / 正常孔", `${detail.holes.length} / ${detail.diagnosis.normalHoleCount}`],
                        ["裂隙 / 胀包数", `${detail.diagnosis.crackCount} / ${detail.diagnosis.blisterCount}`],
                        ["平均孔径 / 均匀度", `${detail.diagnosis.avgDiameter}mm / ${detail.diagnosis.uniformityScore}分`],
                        ["杂菌产气风险", riskLabel(detail.diagnosis.contaminationRisk)],
                      ].map(([k, v], i) => (
                        <div key={i} className="p-2 rounded bg-cream-surface/70 border border-cream-border/70">
                          <div className="text-[10px] text-cream-subtext mb-0.5">{k}</div>
                          <div className="font-medium text-cream-text truncate">{v as string}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="cheese-card p-5 space-y-4">
                    <div>
                      <div className="text-[11px] text-cream-subtext mb-2 font-semibold">孔洞率仪表盘</div>
                      <GaugeChart
                        value={detail.diagnosis.porosityRate}
                        min={0}
                        max={35}
                        targetMin={detail.diagnosis.porosityTargetMin}
                        targetMax={detail.diagnosis.porosityTargetMax}
                        label="孔洞率"
                        unit="%"
                      />
                    </div>
                    <div className="p-3 rounded-md bg-cream-surface/70 border border-cream-border space-y-2 text-[11px]">
                      <div className="text-cream-subtext mb-1 font-semibold">时间轴映射</div>
                      {[
                        ["接种", detail.diagnosis.holeTimeMapping.inoculationDay],
                        ["启孔", detail.diagnosis.holeTimeMapping.startDay],
                        ["扩孔", detail.diagnosis.holeTimeMapping.expansionDay],
                        ["稳定", detail.diagnosis.holeTimeMapping.stableDay],
                      ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-cream-subtext">{k}</span>
                          <span className="font-mono font-medium text-cream-text">Day {v as number}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {tab === "imaging" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <section className="cheese-card p-5">
                    <div className="section-title mb-3">
                      <Circle className="w-4 h-4 text-algae-600" />
                      切面孔洞图
                    </div>
                    <div className="flex items-center justify-center py-2">
                      <CheeseCrossSection
                        holes={detail.holes}
                        defects={detail.defects}
                        size={440}
                      />
                    </div>
                  </section>
                  <section className="space-y-5">
                    <div className="cheese-card p-5">
                      <div className="section-title mb-3">
                        <FolderOpen className="w-4 h-4 text-cheese-600" />
                        原上传切面图
                      </div>
                      {detail.image ? (
                        <div className="space-y-2">
                          <div className="aspect-square rounded-md overflow-hidden border border-cream-border bg-cream-surface/70">
                            <img
                              src={detail.image.dataUrl}
                              alt="上传原图"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-[11px] text-cream-subtext flex justify-between">
                            <span>{detail.image.fileName}</span>
                            <span>{detail.image.width}×{detail.image.height} · {detail.image.uploadedAt}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-cream-subtext bg-cream-surface/50 rounded-md border border-dashed border-cream-border text-xs">
                          <FolderOpen className="w-8 h-8 mb-2 opacity-40" />
                          无图像存档
                        </div>
                      )}
                    </div>
                    <div className="cheese-card p-5">
                      <div className="section-title mb-3">
                        <Grid3x3 className="w-4 h-4 text-cheese-600" />
                        孔洞统计
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["总数", detail.holes.length, "个"],
                          ["正常孔", detail.diagnosis.normalHoleCount, "个"],
                          ["裂隙", detail.diagnosis.crackCount, "条"],
                          ["平均直径", detail.diagnosis.avgDiameter, "mm"],
                          ["均匀度", detail.diagnosis.uniformityScore, "分"],
                          ["CV变异", detail.diagnosis.cvCoefficient, "%"],
                        ].map(([k, v, u], i) => (
                          <div key={i} className="p-2 rounded bg-cream-surface/70 border border-cream-border/80">
                            <div className="text-[10px] text-cream-subtext">{k}</div>
                            <div className="font-serif text-lg font-bold text-cream-text">
                              {v as number}
                              <span className="text-[10px] font-normal text-cream-subtext ml-1">{u}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {tab === "report" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <section className="cheese-card p-5 flex flex-col items-center">
                    <div className="section-title w-full mb-3">
                      <Award className="w-4 h-4 text-cheese-600" />
                      六维品相雷达
                    </div>
                    <RadarChart scores={detail.report.radarScores} size={340} />
                    <div className="mt-4 flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-[10px] text-cream-subtext">综合得分</div>
                        <div className="font-serif text-3xl font-bold" style={{ color: gradeColor[detail.report.grade] }}>
                          {detail.report.totalScore.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-cream-subtext">成品等级</div>
                        <div className="mt-1">{gradeBadge(detail.report.grade)}</div>
                      </div>
                    </div>
                  </section>
                  <section className="cheese-card p-5 space-y-4">
                    <div>
                      <div className="text-[11px] font-semibold text-cream-subtext mb-2">诊断结论</div>
                      <div className="p-3 rounded-md bg-cheese-50/60 border border-cheese-200 text-sm text-cream-text leading-relaxed">
                        {detail.report.conclusion}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-cream-subtext mb-2">改进建议</div>
                      <ol className="space-y-1.5 text-sm">
                        {detail.report.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2 text-cream-text">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full golden-gradient text-white text-[11px] flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span className="flex-1 leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="pt-3 border-t border-cream-border flex items-center justify-between text-[11px] text-cream-subtext">
                      <span>质检员：{detail.report.inspector}</span>
                      <span>签发：{detail.report.issuedAt}</span>
                      <button
                        onClick={() => exportArchivedTxt(detail)}
                        className="cheese-btn-secondary !py-1.5 !px-3"
                      >
                        <Download className="w-3 h-3" />
                        导出TXT
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function d_normal(a: ArchivedBatch) {
  return a.diagnosis.normalHoleCount;
}
