import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  AlertCircle,
  Thermometer,
  Calendar,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Timer,
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import {
  computeRiskLevel,
  riskColor,
  riskLabel,
  simulateFutureHoles,
  simulateTrend,
} from "../utils/trendModel";
import TrendLineChart from "../components/charts/TrendLineChart";
import CheeseCrossSection from "../components/imaging/CheeseCrossSection";
import type { Hole, RiskLevel } from "../types";

export default function TrendPage() {
  const nav = useNavigate();
  const { batch, holes, diagnosis, detected, generateReport } = useBatchStore();

  const [extensionDays, setExtensionDays] = useState(14);
  const [temperatureAdj, setTemperatureAdj] = useState(0);
  const [confidence, setConfidence] = useState(85);

  const d = diagnosis;
  const ripening = batch.ripeningDays;

  const trend = useMemo(() => {
    if (!d || holes.length === 0) return null;
    const abnormalCount = holes.filter((h) => !h.isNormal).length;
    const abnormalRatio = holes.length > 0 ? (abnormalCount / holes.length) * 100 : 0;
    const tempFactor = 1 + (temperatureAdj / 10) * (d.propionibacteriumActivity / 100);
    return simulateTrend(
      ripening,
      extensionDays,
      d.avgDiameter,
      d.porosityRate,
      abnormalRatio,
      d.propionibacteriumActivity,
      tempFactor
    );
  }, [d, holes, ripening, extensionDays, temperatureAdj]);

  const predicted = useMemo(() => {
    if (!trend || !d) return null;
    const finalDay = ripening + extensionDays;
    const last = trend.reduce((a, b) => (Math.abs(b.day - finalDay) < Math.abs(a.day - finalDay) ? b : a));
    const risk = computeRiskLevel(last.porosityRate, last.abnormalRatio, d.porosityTargetMax);
    return { lastPoint: last, risk };
  }, [trend, ripening, extensionDays, d]);

  const futureStages = useMemo<{ days: number; holes: Hole[]; scale: number }[]>(() => {
    if (holes.length === 0) return [];
    const scales = [1, 1.12, 1.28, 1.48];
    const days = [ripening, ripening + 3, ripening + 7, ripening + Math.min(14, extensionDays)];
    return scales.map((s, i) => ({
      days: days[i],
      scale: s,
      holes: simulateFutureHoles(holes, s),
    }));
  }, [holes, ripening, extensionDays]);

  const riskIcon = (lv: RiskLevel) => {
    switch (lv) {
      case "green":
        return <CheckCircle2 className="w-6 h-6" />;
      case "yellow":
        return <AlertCircle className="w-6 h-6" />;
      case "orange":
        return <AlertTriangle className="w-6 h-6" />;
      case "red":
        return <OctagonAlert className="w-6 h-6" />;
    }
  };

  const riskMeasures: Record<RiskLevel, string[]> = {
    green: ["维持当前工艺参数", "按原定计划出货或继续熟成", "保持温湿度巡检频率"],
    yellow: ["加强每日切面巡检频率", "考虑提前 1~2 天转入低温", "关注边缘区域是否出现裂隙"],
    orange: [
      "立即下调暖房温度 1~2℃",
      "缩短熟成时间，建议提前出货",
      "增加翻酪频率以排除积聚气体",
    ],
    red: [
      "‼ 立即转入 4~6℃ 低温冷藏中止发酵",
      "评估批次是否可切割为小规格降级销售",
      "启动下一批次菌种与盐度复核流程",
    ],
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 04 · 发酵趋势推演
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">📈</span>
            熟成趋势模拟与风险告警
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            基于当前孔洞率、丙酸菌活性与温湿度条件，使用 Logistic 生长模型推演继续熟成的孔洞扩张趋势，并对过度发酵风险进行分级预警。
          </p>
        </div>
        <button
          className="cheese-btn-primary"
          onClick={() => {
            generateReport();
            nav("/report");
          }}
        >
          生成分级报告
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {!detected || !d ? (
        <div className="cheese-card p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-cheese-400 mb-4 opacity-60" />
          <div className="font-serif text-xl text-cream-text mb-2">请先完成成像识别与缺陷诊断</div>
          <button className="cheese-btn-primary mt-4" onClick={() => nav("/imaging")}>
            前往切面成像
          </button>
        </div>
      ) : (
        <>
          <section className="cheese-card p-6">
            <div className="section-title">
              <Timer className="w-5 h-5 text-cheese-600" />
              模拟控制面板
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-xs text-cream-subtext font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    延长熟成天数
                  </label>
                  <span className="font-serif font-bold text-cheese-700 text-lg">+{extensionDays} d</span>
                </div>
                <div className="flex gap-2 mb-3">
                  {[3, 7, 14, 21, 30].map((v) => (
                    <button
                      key={v}
                      onClick={() => setExtensionDays(v)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                        extensionDays === v
                          ? "bg-cheese-500 text-white shadow-sm"
                          : "bg-cream-surface border border-cream-border text-cream-subtext hover:border-cheese-400 hover:text-cheese-700"
                      }`}
                    >
                      +{v}d
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={1}
                  max={45}
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(+e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-cream-subtext mt-0.5">
                  <span>+1d</span>
                  <span>合计熟成 {ripening + extensionDays}d</span>
                  <span>+45d</span>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-xs text-cream-subtext font-medium flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" />
                    温度调整
                  </label>
                  <span className="font-serif font-bold text-cheese-700 text-lg">
                    {temperatureAdj > 0 ? "+" : ""}
                    {temperatureAdj} ℃
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  {[-2, -1, 0, 1, 2].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTemperatureAdj(v)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                        temperatureAdj === v
                          ? "bg-algae-500 text-white shadow-sm"
                          : "bg-cream-surface border border-cream-border text-cream-subtext hover:border-algae-400 hover:text-algae-700"
                      }`}
                    >
                      {v > 0 ? "+" : ""}
                      {v}℃
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={0.5}
                  value={temperatureAdj}
                  onChange={(e) => setTemperatureAdj(+e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-cream-subtext mt-0.5">
                  <span>-4℃ 降温抑制</span>
                  <span className="text-algae-600">推荐 0 ~ +1℃</span>
                  <span>+4℃ 加温促酵</span>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-xs text-cream-subtext font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    模型置信度
                  </label>
                  <span className="font-serif font-bold text-cheese-700 text-lg">{confidence}%</span>
                </div>
                <div className="p-4 rounded-md bg-cream-surface/80 border border-cream-border mb-3">
                  <div className="h-2 rounded-full bg-cream-border overflow-hidden mb-3">
                    <div
                      className="h-full golden-gradient transition-all duration-500"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">当前活性指数</span>
                      <span className="font-mono font-semibold text-algae-700">
                        {d.propionibacteriumActivity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">样本数据完整度</span>
                      <span className="font-mono font-semibold text-cheese-700">
                        {Math.min(98, 72 + holes.length / 8).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream-subtext">历史匹配图谱</span>
                      <span className="font-mono font-semibold text-cream-text">
                        {6 + (d.propionibacteriumActivity % 7)} 条
                      </span>
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={50}
                  max={98}
                  value={confidence}
                  onChange={(e) => setConfidence(+e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </section>

          <section className="cheese-card p-6">
            <div className="section-title">
              <TrendingUp className="w-5 h-5 text-cheese-600" />
              孔洞扩张趋势曲线
              <span className="ml-auto text-xs font-normal text-cream-subtext">
                共推演 {trend?.length ?? 0} 个时间节点
              </span>
            </div>
            {trend && (
              <TrendLineChart
                points={trend}
                currentDay={ripening}
                targetMax={d.porosityTargetMax}
              />
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 cheese-card p-6">
              <div className="section-title">
                <ShieldAlert className="w-5 h-5 text-wine-500" />
                过度发酵风险分级告警
              </div>
              {predicted && (
                <div className="space-y-5">
                  <div
                    className="p-5 rounded-lg border-2 flex items-start gap-4"
                    style={{
                      background: `${riskColor(predicted.risk)}10`,
                      borderColor: `${riskColor(predicted.risk)}55`,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md"
                      style={{ background: riskColor(predicted.risk) }}
                    >
                      {riskIcon(predicted.risk)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-serif text-2xl font-bold" style={{ color: riskColor(predicted.risk) }}>
                          {riskLabel(predicted.risk)}
                        </span>
                        <span className="badge" style={{ background: `${riskColor(predicted.risk)}20`, color: riskColor(predicted.risk) }}>
                          R{["green", "yellow", "orange", "red"].indexOf(predicted.risk) + 1} 级
                        </span>
                        <span className="ml-auto text-[11px] text-cream-subtext">
                          预计第 {ripening + extensionDays} 天的风险判定
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-[10px] text-cream-subtext mb-0.5">预测孔洞率</div>
                          <div className="font-mono font-bold text-cream-text">
                            {predicted.lastPoint.porosityRate.toFixed(1)}%
                            <span className="ml-1 text-[10px] text-cream-subtext">
                              (目标≤{d.porosityTargetMax}%)
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-cream-subtext mb-0.5">预测平均孔径</div>
                          <div className="font-mono font-bold text-cream-text">
                            {predicted.lastPoint.avgDiameter.toFixed(2)} mm
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-cream-subtext mb-0.5">异常孔占比</div>
                          <div
                            className="font-mono font-bold"
                            style={{
                              color:
                                predicted.lastPoint.abnormalRatio > 30 ? "#B33951" : "#2B2A27",
                            }}
                          >
                            {predicted.lastPoint.abnormalRatio.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-cream-text mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-cheese-600" />
                      建议应对措施
                    </div>
                    <div className="space-y-2">
                      {riskMeasures[predicted.risk].map((m, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-md bg-cream-surface/80 border border-cream-border flex items-start gap-2 text-sm"
                        >
                          <span
                            className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                            style={{ background: riskColor(predicted.risk) }}
                          >
                            {i + 1}
                          </span>
                          <div className="text-cream-text">{m}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="cheese-card p-6">
              <div className="section-title">
                <AlertCircle className="w-5 h-5 text-cheese-600" />
                触发阈值说明
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { lv: "green" as RiskLevel, t: "孔洞率 ≤ 目标上限 × 1.0", d: "发酵受控，可继续" },
                  { lv: "yellow" as RiskLevel, t: "1.0 ＜ 孔洞率 ≤ 1.15 或 异常孔＞15%", d: "需要关注，不可大意" },
                  { lv: "orange" as RiskLevel, t: "1.15 ＜ 孔洞率 ≤ 1.35 或 异常孔＞30%", d: "告警启动，建议干预" },
                  { lv: "red" as RiskLevel, t: "孔洞率 ＞ 1.35 或 异常孔＞50%", d: "紧急处理，中止发酵" },
                ].map((it) => (
                  <div
                    key={it.lv}
                    className={`p-2.5 rounded-md border flex items-start gap-2.5 ${
                      predicted?.risk === it.lv
                        ? "ring-2 ring-offset-1"
                        : ""
                    }`}
                    style={{
                      background: `${riskColor(it.lv)}0D`,
                      borderColor: `${riskColor(it.lv)}44`,
                      boxShadow: predicted?.risk === it.lv ? `0 0 0 2px ${riskColor(it.lv)}` : undefined,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-1"
                      style={{ background: riskColor(it.lv) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold" style={{ color: riskColor(it.lv) }}>
                        {riskLabel(it.lv)}级 · {it.t}
                      </div>
                      <div className="text-[11px] text-cream-subtext mt-0.5">{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="cheese-card p-6">
            <div className="section-title">
              <TrendingUp className="w-5 h-5 text-algae-600" />
              孔洞演变影像 · 时间切片对比
              <span className="ml-auto text-xs font-normal text-cream-subtext">
                基于扩张因子模拟 · 裂隙按 ×1.6 权重加速
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {futureStages.map((stage, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-md border transition-all ${
                    i === 0
                      ? "bg-cheese-50/60 border-cheese-300"
                      : "bg-cream-surface/80 border-cream-border hover:border-cheese-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold ${
                        i === 0 ? "text-cheese-700" : "text-cream-subtext"
                      }`}
                    >
                      Day {stage.days}
                    </span>
                    {i > 0 && (
                      <span className="badge bg-algae-100 text-algae-700 text-[9px]">
                        +{stage.days - ripening}d
                      </span>
                    )}
                    {i === 0 && <span className="badge bg-cheese-200 text-cheese-800 text-[9px]">当前</span>}
                  </div>
                  <div className="flex items-center justify-center bg-cream-bg rounded-md p-1 border border-cream-border/60">
                    <CheeseCrossSection
                      holes={stage.holes}
                      defects={i === 0 ? [] : []}
                      size={200}
                      showDefects={i === 0}
                    />
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-cream-border space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-cream-subtext">扩张倍率</span>
                      <span className="font-mono font-semibold text-cheese-700">
                        ×{stage.scale.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-cream-border overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, ((stage.scale - 1) / 0.6) * 100)}%`,
                          background:
                            i < 2
                              ? "#4A7C59"
                              : i < 3
                              ? "#C9A66B"
                              : "#B33951",
                        }}
                      />
                    </div>
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
