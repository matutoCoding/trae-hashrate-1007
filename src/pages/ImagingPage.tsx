import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Upload,
  Image,
  Play,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Grid3x3,
  Circle,
  Hexagon,
  X,
  Info,
} from "lucide-react";
import { useBatchStore } from "../hooks/useBatchStore";
import { computeDiameterDistribution, computeAverageDiameter, computeUniformity, computeCVCoefficient } from "../utils/holeAlgorithms";
import type { CrossSectionImage, HoleCategory } from "../types";
import { HOLE_CATEGORY_LABELS } from "../types";
import CheeseCrossSection from "../components/imaging/CheeseCrossSection";
import BarChart from "../components/charts/BarChart";

function computeBrightnessSignature(dataUrl: string): Promise<{ w: number; h: number; sig: number; darkRatio: number }> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const maxSide = 256;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ w: img.width, h: img.height, sig: 128, darkRatio: 0.3 });
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      let darkPx = 0;
      const total = w * h;
      for (let i = 0; i < imgData.length; i += 4) {
        const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        sum += lum;
        if (lum < 90) darkPx++;
      }
      const avg = sum / total;
      resolve({
        w: img.width,
        h: img.height,
        sig: Math.round(avg),
        darkRatio: Math.round((darkPx / total) * 200),
      });
    };
    img.onerror = () => resolve({ w: 600, h: 600, sig: 128, darkRatio: 60 });
    img.src = dataUrl;
  });
}

export default function ImagingPage() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { batch, holes, defects, detected, runDetection, computeAllDiagnosis, image, setImage } = useBatchStore();

  const [threshold, setThreshold] = useState(128);
  const [minDiameter, setMinDiameter] = useState(1.5);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [highlight, setHighlight] = useState<HoleCategory | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [previewSrc, setPreviewSrc] = useState<string | null>(image?.dataUrl ?? null);
  const [previewMeta, setPreviewMeta] = useState<{ size: number; name: string; width?: number; height?: number; sig?: number } | null>(
    image ? { size: image.fileSize, name: image.fileName, width: image.width, height: image.height } : null
  );

  const samples = ["标准切面示例", "边缘裂隙示例", "中心集孔示例", "超大孔示例"];

  const stats = useMemo(() => {
    if (holes.length === 0) return null;
    return {
      total: holes.length,
      avgD: computeAverageDiameter(holes.filter((h) => h.category !== "crack")).toFixed(2),
      normalCount: holes.filter((h) => h.isNormal).length,
      crackCount: holes.filter((h) => h.category === "crack").length,
      uniformity: computeUniformity(holes).toFixed(1),
      cv: computeCVCoefficient(holes.filter((h) => h.category !== "crack")).toFixed(1),
      distribution: computeDiameterDistribution(holes),
    };
  }, [holes]);

  const triggerUpload = () => fileRef.current?.click();

  const handleFile = (f: File) => {
    if (!f) return;
    if (!/image\/(jpeg|png|jpg|webp)/i.test(f.type)) {
      alert("仅支持 JPG / PNG / WEBP 图像");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreviewSrc(dataUrl);
      const { w, h, sig, darkRatio } = await computeBrightnessSignature(dataUrl);
      const meta: CrossSectionImage = {
        id: `IMG-${Date.now()}`,
        fileName: f.name,
        fileSize: f.size,
        width: w,
        height: h,
        dataUrl,
        uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        source: "upload",
      };
      setPreviewMeta({ size: f.size, name: f.name, width: w, height: h, sig });
      setImage(meta, sig * 2 + darkRatio);
    };
    reader.readAsDataURL(f);
  };

  const handleSampleClick = (idx: number) => {
    setSampleIdx(idx);
    const brightnessBias = idx * 31 + 47;
    const w = 800, h = 800;
    const svgPreview = `data:image/svg+xml;utf8,` + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 800 800'>
        <defs>
          <radialGradient id='g' cx='50%' cy='46%' r='62%'>
            <stop offset='0%' stop-color='#F8E6B8'/>
            <stop offset='65%' stop-color='#DDB972'/>
            <stop offset='100%' stop-color='#8C5A20'/>
          </radialGradient>
        </defs>
        <rect width='100%' height='100%' fill='#F2E9D8'/>
        <circle cx='400' cy='400' r='360' fill='url(#g)' stroke='#7A4C1A' stroke-width='4'/>
        ${Array.from({ length: 42 + idx * 6 }).map((_, i) => {
          const seed = (i * 73 + idx * 17) % 100;
          const cx = 80 + (seed * 6.4);
          const cy = 70 + ((seed * 41) % 680);
          const r = 3 + ((seed + idx * 7) % 20);
          const isCrack = idx === 1 && (i % 5 === 0);
          return isCrack
            ? `<ellipse cx='${cx}' cy='${cy}' rx='${r * 0.3}' ry='${r * 2.8}' fill='#6B2B3B' opacity='0.75'/>`
            : `<circle cx='${cx}' cy='${cy}' r='${r}' fill='#4A7C5955' stroke='#2D4A34' stroke-width='0.8'/>`;
        }).join("")}
      </svg>`
    );
    setPreviewSrc(svgPreview);
    const sampleMeta: CrossSectionImage = {
      id: `SMP-${Date.now()}-${idx}`,
      fileName: samples[idx] + ".svg",
      fileSize: 12000 + idx * 3000,
      width: w,
      height: h,
      dataUrl: svgPreview,
      uploadedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      source: "sample",
      sampleIndex: idx,
    };
    setPreviewMeta({ size: sampleMeta.fileSize, name: sampleMeta.fileName, width: w, height: h, sig: brightnessBias });
    setImage(sampleMeta, brightnessBias * 2 + (idx + 1) * 11);
  };

  const clearImage = () => {
    setPreviewSrc(null);
    setPreviewMeta(null);
    setImage(null, 0);
  };

  const handleDetect = () => {
    setRunning(true);
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += Math.random() * 18 + 6;
      setProgress(Math.min(99, p));
      if (p >= 95) {
        clearInterval(timer);
        setProgress(100);
        const seedBias = (previewMeta?.sig ?? 64) + sampleIdx * 15;
        runDetection(threshold, minDiameter, seedBias);
        setTimeout(() => {
          setRunning(false);
        }, 300);
      }
    }, 180);
  };

  const catColors: Record<HoleCategory, string> = {
    micro: "#B0D2BA",
    small: "#88BC98",
    medium: "#61A576",
    large: "#D0A962",
    xlarge: "#B33951",
    crack: "#CF536F",
  };

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-cheese-600 font-semibold mb-1">
            Page 02 · 切面图像识别
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-text flex items-center gap-3">
            <span className="text-3xl">📸</span>
            切面成像与孔洞识别工作台
          </h1>
          <p className="text-sm text-cream-subtext mt-2 max-w-2xl">
            上传奶酪切面照片，或选择内置示例图进行识别。系统通过二值化 + 轮廓提取算法识别孔洞轮廓，区分「正常气孔」与「裂隙缝隙」，计算大小分布、均匀度与各项统计指标。
          </p>
        </div>
        <button
          className="cheese-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (!detected) handleDetect();
            else computeAllDiagnosis();
            nav("/diagnosis");
          }}
          disabled={running}
        >
          {detected ? "查看缺陷诊断" : "先完成成像识别"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <section className="cheese-card p-6">
            <div className="section-title">
              <Upload className="w-5 h-5 text-cheese-600" />
              切面上图 / 示例选择
            </div>

            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />

            {!previewSrc ? (
              <div
                className="group relative border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-cheese-400 hover:bg-cheese-50/40 transition-all"
                style={{ borderColor: "#E8DFCD" }}
                onClick={triggerUpload}
              >
                <Camera className="w-10 h-10 mx-auto text-cheese-500 mb-3 opacity-80 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-medium text-cream-text mb-1">
                  点击选择本地切面照片 · JPG/PNG
                </div>
                <div className="text-xs text-cream-subtext">
                  或从下方 4 组内置示例图中挑选
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-cheese-600 bg-cheese-50 px-2.5 py-1 rounded border border-cheese-200">
                  <Upload className="w-3 h-3" />
                  选择文件
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-cream-card/90 border border-cream-border flex items-center justify-center text-cream-subtext hover:text-wine-600 hover:border-wine-300 transition-all shadow-sm"
                  title="清除当前图片"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="rounded-md border border-cream-border overflow-hidden bg-cream-surface/60">
                  <div className="aspect-square flex items-center justify-center p-2">
                    <img
                      src={previewSrc}
                      alt="切面预览"
                      className="max-w-full max-h-full object-contain rounded-sm"
                      style={{ maxHeight: 300 }}
                    />
                  </div>
                </div>
                {previewMeta && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-cream-subtext">
                    <div className="p-2 rounded bg-algae-50/60 border border-algae-200">
                      <div className="text-algae-700 font-semibold mb-0.5">文件</div>
                      <div className="truncate" title={previewMeta.name}>{previewMeta.name}</div>
                    </div>
                    <div className="p-2 rounded bg-cheese-50/60 border border-cheese-200">
                      <div className="text-cheese-700 font-semibold mb-0.5">尺寸 / 大小</div>
                      <div>{previewMeta.width}×{previewMeta.height} / {formatSize(previewMeta.size)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {samples.map((s, i) => (
                <button
                  key={s}
                  onClick={() => handleSampleClick(i)}
                  className={`text-left text-xs px-3 py-2 rounded border transition-all ${
                    sampleIdx === i && image?.source === "sample" && image.sampleIndex === i
                      ? "bg-cheese-100 border-cheese-400 text-cheese-800 font-semibold shadow-sm"
                      : "bg-cream-surface border-cream-border text-cream-subtext hover:border-cheese-300"
                  }`}
                >
                  <Image className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-md bg-algae-50/60 border border-algae-200 text-xs text-algae-700 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                当前来源：<b>{image?.source === "upload" ? "本地上传" : image?.source === "sample" ? samples[sampleIdx] : "未选择"}</b>
                （批次 {batch.batchNo} · 熟成 {batch.ripeningDays}d）。调整下方阈值与最小孔径后点击「运行识别」。
              </span>
            </div>

            {previewMeta?.sig !== undefined && (
              <div className="mt-3 p-2.5 rounded bg-cream-surface/80 border border-cream-border text-[11px] text-cream-subtext flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cheese-600 shrink-0" />
                <span>
                  图像特征：平均亮度 <b className="text-cheese-700">{previewMeta.sig}</b>
                  {previewMeta.sig < 80 && <span className="text-wine-600 ml-1">（偏暗，可能存在裂隙聚集）</span>}
                  {previewMeta.sig > 140 && <span className="text-algae-700 ml-1">（偏亮，孔洞清晰）</span>}
                  — 将作为孔洞生成的随机种子
                </span>
              </div>
            )}
          </section>

          <section className="cheese-card p-6">
            <div className="section-title">
              <SlidersHorizontal className="w-5 h-5 text-cheese-600" />
              识别参数控制
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-xs text-cream-subtext font-medium">
                    二值化灰度阈值
                  </label>
                  <span className="font-mono text-sm font-semibold text-cheese-700">
                    {threshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={220}
                  value={threshold}
                  onChange={(e) => setThreshold(+e.target.value)}
                  disabled={running}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-cream-subtext mt-0.5">
                  <span>40 灵敏（多检出）</span>
                  <span>220 保守（少检出）</span>
                </div>
              </div>
              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-xs text-cream-subtext font-medium">
                    最小过滤孔径 (mm)
                  </label>
                  <span className="font-mono text-sm font-semibold text-cheese-700">
                    {minDiameter.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={8}
                  step={0.1}
                  value={minDiameter}
                  onChange={(e) => setMinDiameter(+e.target.value)}
                  disabled={running}
                  className="w-full"
                />
              </div>

              {running && (
                <div>
                  <div className="h-2 rounded-full bg-cream-border overflow-hidden">
                    <div
                      className="h-full golden-gradient transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-cream-subtext text-right">
                    识别进度 {progress.toFixed(0)}% · 轮廓提取中…
                  </div>
                </div>
              )}

              <button
                className="cheese-btn-algae w-full"
                onClick={handleDetect}
                disabled={running}
              >
                <Play className="w-4 h-4" />
                {running ? "正在识别…" : detected ? "重新运行识别" : "▶ 运行孔洞识别"}
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <section className="cheese-card p-6">
            <div className="section-title">
              <Circle className="w-5 h-5 text-algae-600" />
              切面成像识别视图
              <span className="ml-auto text-xs font-normal text-cream-subtext">
                {detected ? `共检出 ${holes.length} 个对象` : "等待运行识别"}
              </span>
            </div>
            <div className="flex items-center justify-center py-2">
              <CheeseCrossSection
                holes={holes}
                defects={defects}
                highlightCategory={highlight}
                size={520}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-cream-border">
              <div className="text-xs font-semibold text-cream-subtext mb-3">
                分类图例（点击可筛选高亮）
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(Object.keys(HOLE_CATEGORY_LABELS) as HoleCategory[]).map((c) => {
                  const isActive = highlight === c;
                  const dim = highlight && !isActive;
                  return (
                    <button
                      key={c}
                      onClick={() => setHighlight(isActive ? null : c)}
                      className={`p-2 rounded border text-left transition-all ${
                        isActive
                          ? "border-cheese-400 bg-cheese-50 shadow-sm"
                          : "border-cream-border bg-cream-surface hover:border-cheese-300"
                      } ${dim ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full border"
                          style={{
                            background: catColors[c] + "88",
                            borderColor: catColors[c],
                          }}
                        />
                        <span className="text-xs font-semibold text-cream-text">
                          {HOLE_CATEGORY_LABELS[c]}
                        </span>
                      </div>
                      <div className="text-[10px] text-cream-subtext">
                        {stats?.distribution?.[c] ?? 0} 个
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                className="mt-3 text-[11px] text-cheese-600 hover:text-cheese-800 underline underline-offset-2"
                onClick={() => setHighlight(null)}
              >
                清除筛选
              </button>
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "孔洞总数", val: stats?.total ?? "—", unit: "个", color: "text-cheese-700", icon: <Circle className="w-3.5 h-3.5" /> },
              { label: "平均直径", val: stats?.avgD ?? "—", unit: "mm", color: "text-algae-700", icon: <Hexagon className="w-3.5 h-3.5" /> },
              { label: "正常气孔", val: stats?.normalCount ?? "—", unit: "个", color: "text-algae-700", icon: <Circle className="w-3.5 h-3.5" /> },
              { label: "裂隙条数", val: stats?.crackCount ?? "—", unit: "条", color: "text-wine-600", icon: <Hexagon className="w-3.5 h-3.5" /> },
              { label: "均匀度", val: stats?.uniformity ?? "—", unit: "分", color: "text-cheese-700", icon: <Grid3x3 className="w-3.5 h-3.5" /> },
              { label: "变异系数CV", val: stats?.cv ?? "—", unit: "%", color: "text-cream-subtext", icon: <Grid3x3 className="w-3.5 h-3.5" /> },
            ].map((s, i) => (
              <div key={i} className="cheese-card p-4">
                <div className={`flex items-center gap-1.5 text-[10px] text-cream-subtext mb-1.5 ${s.color}`}>
                  {s.icon}
                  {s.label}
                </div>
                <div className={`font-serif text-2xl font-bold ${s.color}`}>
                  {s.val}
                  <span className="ml-1 text-xs font-normal text-cream-subtext">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <section className="cheese-card p-6">
            <div className="section-title">
              <Circle className="w-5 h-5 text-cheese-600" />
              孔径分布直方图
            </div>
            {stats?.distribution ? (
              <BarChart
                data={stats.distribution}
                highlight={highlight}
                onHighlight={setHighlight}
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-cream-subtext bg-cream-surface/50 rounded-md border border-dashed border-cream-border">
                请先运行孔洞识别以生成分布图
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
