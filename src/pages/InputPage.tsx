import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Droplets,
  Thermometer,
  Leaf,
  Beaker,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCcw,
  Bug,
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import { CHEESE_TYPES, STRAIN_TYPES } from "../types";
import TempHumiditySparkline from "../components/charts/TempHumiditySparkline";

export default function InputPage() {
  const nav = useNavigate();
  const {
    batch,
    setBatch,
    addTempStage,
    updateTempStage,
    removeTempStage,
    resetBatch,
  } = useBatchStore();

  const contamHint = (() => {
    const ok = batch.salinity >= 1.5 && batch.pH <= 5.4 && batch.titratableAcid >= 14;
    if (ok) return { ok: true, msg: "盐酸度组合良好，杂菌产气抑制达标 ✓" };
    const items: string[] = [];
    if (batch.salinity < 1.5) items.push("盐度偏低（建议≥1.5%）");
    if (batch.pH > 5.4) items.push("pH偏高（建议≤5.4）");
    if (batch.titratableAcid < 14) items.push("滴定酸度偏低（建议≥14°D）");
    return { ok: false, msg: "⚠ " + items.join("；") + "，存在杂菌产气风险" };
  })();

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 01 · 生产参数录入
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">📋</span>
            投料与熟成参数建档
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            录入每轮奶酪的基础信息、菌种产气量、熟成温湿度曲线与盐酸度指标，作为后续成像识别与缺陷诊断的基准对照。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="cheese-btn-secondary" onClick={resetBatch}>
            <RefreshCcw className="w-4 h-4" />
            重置批次
          </button>
          <button
            className="cheese-btn-primary"
            onClick={() => {
              nav("/imaging");
            }}
          >
            保存并进入成像
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <section className="cheese-card p-6">
        <div className="section-title">
          <Calendar className="w-5 h-5 text-cheese-600" />
          批次基础信息
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              批次编号
            </label>
            <input className="cheese-input font-mono bg-cheese-50/50" value={batch.batchNo} readOnly />
          </div>
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              奶酪品种
            </label>
            <select
              className="cheese-select"
              value={batch.cheeseType}
              onChange={(e) => setBatch("cheeseType", e.target.value as typeof batch.cheeseType)}
            >
              {CHEESE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              生产日期
            </label>
            <input
              type="date"
              className="cheese-input"
              value={batch.productionDate}
              onChange={(e) => setBatch("productionDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              已熟成天数（天）
            </label>
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 rounded border border-cream-border bg-cream-surface hover:border-cheese-400 hover:text-cheese-700 text-lg font-medium"
                onClick={() =>
                  setBatch("ripeningDays", Math.max(0, batch.ripeningDays - 1))
                }
              >
                −
              </button>
              <input
                type="number"
                min={0}
                className="cheese-input text-center font-semibold"
                value={batch.ripeningDays}
                onChange={(e) =>
                  setBatch("ripeningDays", Math.max(0, +e.target.value || 0))
                }
              />
              <button
                className="w-9 h-9 rounded border border-cream-border bg-cream-surface hover:border-cheese-400 hover:text-cheese-700 text-lg font-medium"
                onClick={() => setBatch("ripeningDays", batch.ripeningDays + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="cheese-card p-6">
        <div className="section-title">
          <Bug className="w-5 h-5 text-algae-600" />
          菌种与产气参数
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              接种丙酸菌菌株
            </label>
            <select
              className="cheese-select"
              value={batch.strain}
              onChange={(e) => setBatch("strain", e.target.value as typeof batch.strain)}
            >
              {STRAIN_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-cream-subtext">
              <div className="p-2 rounded bg-cheese-50/50 border border-cheese-100">
                <div className="font-medium text-cheese-700">最适温度</div>
                <div>20 ~ 24 ℃</div>
              </div>
              <div className="p-2 rounded bg-algae-50/50 border border-algae-100">
                <div className="font-medium text-algae-700">最适 pH</div>
                <div>5.2 ~ 5.6</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-end justify-between mb-2">
                <label className="block text-xs text-cream-subtext font-medium">
                  理论产气量 (mL/100g)
                </label>
                <span className="font-mono font-semibold text-cheese-700 text-sm">
                  {batch.theoreticalGas} mL
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={200}
                value={batch.theoreticalGas}
                onChange={(e) =>
                  setBatch("theoreticalGas", +e.target.value)
                }
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-cream-subtext mt-0.5">
                <span>40 低发酵</span>
                <span>120 标准</span>
                <span>200 高发酵</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-cream-subtext font-medium mb-1.5">
                  实测产气量 (mL)
                </label>
                <input
                  type="number"
                  step="1"
                  className="cheese-input"
                  value={batch.measuredGas}
                  onChange={(e) => setBatch("measuredGas", +e.target.value || 0)}
                />
              </div>
              <div>
                <label className="block text-xs text-cream-subtext font-medium mb-1.5">
                  接种量 (U/100L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="cheese-input"
                  value={batch.inoculation}
                  onChange={(e) => setBatch("inoculation", +e.target.value || 0)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cheese-card p-6">
        <div className="section-title">
          <Thermometer className="w-5 h-5 text-wine-500" />
          熟成温湿度阶段曲线
        </div>
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-cream-subtext border-b border-cream-border">
                <th className="py-2.5 px-3 font-medium">阶段名</th>
                <th className="py-2.5 px-3 font-medium">温度 ℃</th>
                <th className="py-2.5 px-3 font-medium">湿度 %</th>
                <th className="py-2.5 px-3 font-medium">时长 h</th>
                <th className="py-2.5 px-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {batch.tempHumidityStages.map((st, i) => (
                <tr
                  key={i}
                  className={`border-b border-cream-border/50 ${
                    i % 2 ? "bg-cheese-50/30" : "bg-cream-card"
                  }`}
                >
                  <td className="py-2 px-3">
                    <input
                      className="cheese-input"
                      value={st.name}
                      onChange={(e) => updateTempStage(i, { name: e.target.value })}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.5"
                      className="cheese-input"
                      value={st.temperature}
                      onChange={(e) =>
                        updateTempStage(i, { temperature: +e.target.value || 0 })
                      }
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="1"
                      className="cheese-input"
                      value={st.humidity}
                      onChange={(e) =>
                        updateTempStage(i, { humidity: +e.target.value || 0 })
                      }
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="1"
                      className="cheese-input"
                      value={st.durationHours}
                      onChange={(e) =>
                        updateTempStage(i, { durationHours: +e.target.value || 0 })
                      }
                    />
                  </td>
                  <td className="py-2 px-3">
                    <button
                      className="w-8 h-8 rounded border border-wine-200 text-wine-500 hover:bg-wine-50 transition"
                      onClick={() => removeTempStage(i)}
                      disabled={batch.tempHumidityStages.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mb-4">
          <button className="cheese-btn-secondary text-xs" onClick={addTempStage}>
            <Plus className="w-3.5 h-3.5" />
            添加熟成阶段
          </button>
          <span className="text-[11px] text-cream-subtext">
            <Leaf className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            建议至少包含「暖房熟成」与「低温稳定」两个关键阶段
          </span>
        </div>
        <div className="p-4 rounded-md bg-cream-surface/80 border border-cream-border">
          <TempHumiditySparkline stages={batch.tempHumidityStages} />
        </div>
      </section>

      <section className="cheese-card p-6">
        <div className="section-title">
          <Beaker className="w-5 h-5 text-cheese-700" />
          盐度与酸度（杂菌产气抑制校验）
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              盐度 %
              <span className="ml-1 text-algae-600 font-normal">（目标 ≥1.5%）</span>
            </label>
            <input
              type="number"
              step="0.1"
              className={`cheese-input ${
                batch.salinity < 1.5 ? "border-wine-300 focus:border-wine-400 focus:ring-wine-200" : ""
              }`}
              value={batch.salinity}
              onChange={(e) => setBatch("salinity", +e.target.value || 0)}
            />
            <div className="mt-2 h-1.5 rounded-full bg-cream-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  batch.salinity >= 1.5 ? "bg-algae-500" : "bg-wine-500"
                }`}
                style={{ width: `${Math.min(100, (batch.salinity / 3) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              pH 值
              <span className="ml-1 text-algae-600 font-normal">（目标 ≤5.4）</span>
            </label>
            <input
              type="number"
              step="0.01"
              className={`cheese-input ${
                batch.pH > 5.4 ? "border-wine-300 focus:border-wine-400 focus:ring-wine-200" : ""
              }`}
              value={batch.pH}
              onChange={(e) => setBatch("pH", +e.target.value || 0)}
            />
            <div className="mt-2 h-1.5 rounded-full bg-cream-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  batch.pH <= 5.4 ? "bg-algae-500" : "bg-wine-500"
                }`}
                style={{ width: `${Math.min(100, ((7 - batch.pH) / (7 - 4.5)) * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cream-subtext font-medium mb-1.5">
              滴定酸度 °D
              <span className="ml-1 text-algae-600 font-normal">（目标 ≥14°D）</span>
            </label>
            <input
              type="number"
              step="0.5"
              className={`cheese-input ${
                batch.titratableAcid < 14 ? "border-wine-300 focus:border-wine-400 focus:ring-wine-200" : ""
              }`}
              value={batch.titratableAcid}
              onChange={(e) => setBatch("titratableAcid", +e.target.value || 0)}
            />
            <div className="mt-2 h-1.5 rounded-full bg-cream-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  batch.titratableAcid >= 14 ? "bg-algae-500" : "bg-wine-500"
                }`}
                style={{ width: `${Math.min(100, (batch.titratableAcid / 25) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div
          className={`p-3.5 rounded-md border flex items-start gap-3 ${
            contamHint.ok
              ? "bg-algae-50 border-algae-200"
              : "bg-wine-50 border-wine-200"
          }`}
        >
          <Droplets
            className={`w-5 h-5 mt-0.5 shrink-0 ${
              contamHint.ok ? "text-algae-600" : "text-wine-500"
            }`}
          />
          <div>
            <div
              className={`text-xs font-semibold mb-0.5 ${
                contamHint.ok ? "text-algae-700" : "text-wine-700"
              }`}
            >
              杂菌产气抑制校验
            </div>
            <div className="text-sm text-cream-text">{contamHint.msg}</div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between pt-2 pb-4">
        <div className="text-xs text-cream-subtext">
          💡 提示：参数填写越完整，后续孔洞诊断与发酵趋势预测的准确性越高。
        </div>
        <button
          className="cheese-btn-primary"
          onClick={() => {
            nav("/imaging");
          }}
        >
          保存批次，进入切面成像 →
        </button>
      </footer>
    </div>
  );
}
