import { create } from "zustand";
import type {
  Batch,
  Hole,
  Defect,
  Diagnosis,
  Report,
  RadarScores,
  TempHumidityStage,
  CrossSectionImage,
  ArchivedBatch,
  SpectrumEntry,
  DefectType,
  Grade,
} from "../types";
import { DEFAULT_BATCH, MOCK_DEFECTS, generateBatchNo, MOCK_SPECTRUM } from "../utils/mockData";
import {
  computeAverageDiameter,
  computeCVCoefficient,
  computePorosity,
  computeUniformity,
  generateMockHoles,
} from "../utils/holeAlgorithms";
import {
  computeContaminationRisk,
  computePropionibacteriumActivity,
  generateHoleTimelineMapping,
} from "../utils/trendModel";
import {
  computeRadarScores,
  computeTotalScore,
  computeGrade,
  generateConclusion,
  generateSuggestions,
} from "../utils/gradingScoring";

const STORAGE_KEY = "ru-ce-gongfang::state::v1";
const STORAGE_ARCHIVE_KEY = "ru-ce-gongfang::archive::v1";

const TARGET_POROSITY_MIN = 10;
const TARGET_POROSITY_MAX = 22;
const TOTAL_AREA_PX = 600 * 600 * 0.72;

interface PersistSnapshot {
  batch: Batch;
  holes: Hole[];
  defects: Defect[];
  diagnosis: Diagnosis | null;
  report: Report | null;
  detected: boolean;
  image: CrossSectionImage | null;
}

function loadPersist(): PersistSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistSnapshot;
  } catch {
    return null;
  }
}

function savePersist(snap: PersistSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* storage full, ignore */
  }
}

function loadArchive(): ArchivedBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_ARCHIVE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ArchivedBatch[];
  } catch {
    return [];
  }
}

function saveArchive(list: ArchivedBatch[]) {
  try {
    localStorage.setItem(STORAGE_ARCHIVE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function buildInitialDiagnosis(batch: Batch, holes: Hole[], defects: Defect[]): Diagnosis {
  const normal = holes.filter((h) => h.isNormal).length;
  const crack = holes.filter((h) => h.category === "crack").length;
  const blister = defects.filter((d) => d.type === "early_blister").length;
  const normalRatio = holes.length > 0 ? normal / holes.length : 0;
  const avgD = computeAverageDiameter(holes.filter((h) => h.category !== "crack"));
  const activity = computePropionibacteriumActivity(
    batch.measuredGas,
    batch.theoreticalGas,
    normalRatio,
    avgD
  );
  const porosity = computePorosity(holes, TOTAL_AREA_PX);
  return {
    batchId: batch.id,
    porosityRate: +porosity.toFixed(2),
    porosityTargetMin: TARGET_POROSITY_MIN,
    porosityTargetMax: TARGET_POROSITY_MAX,
    porosityPass: porosity >= TARGET_POROSITY_MIN && porosity <= TARGET_POROSITY_MAX,
    propionibacteriumActivity: activity,
    contaminationRisk: computeContaminationRisk(batch.salinity, batch.pH, batch.titratableAcid),
    normalHoleCount: normal,
    crackCount: crack,
    blisterCount: blister,
    avgDiameter: +avgD.toFixed(2),
    uniformityScore: +computeUniformity(holes).toFixed(1),
    cvCoefficient: +computeCVCoefficient(holes.filter((h) => h.category !== "crack")).toFixed(1),
    giniCoefficient: 0.0,
    holeTimeMapping: generateHoleTimelineMapping(batch.ripeningDays, activity),
  };
}

function defectSummary(defects: Defect[], crackCount: number): DefectType[] {
  const set = new Set<DefectType>();
  defects.forEach((d) => set.add(d.type));
  if (crackCount > 0) set.add("late_crack");
  if ([...set].length === 0 && defects.length === 0 && crackCount === 0) return [];
  const list: DefectType[] = [...set];
  if (list.includes("late_crack") && crackCount > 3) list.push("collapsed");
  return list;
}

function spectrumLabel(defects: DefectType[], grade: Grade, avgD: number): string {
  if (defects.length === 0 && grade === "A") return "标准均匀孔型";
  if (defects.includes("early_blister")) return "早期皮下胀包";
  if (defects.includes("collapsed")) return "孔洞塌陷·杂菌污染";
  if (defects.includes("late_crack") && defects.includes("uneven")) return "裂隙网络·严重";
  if (defects.includes("late_crack")) return avgD > 16 ? "晚期放射裂纹" : "晚期网状裂纹";
  if (defects.includes("uneven")) return avgD < 6 ? "微孔过多·发酵不足" : "中心密孔·轻度";
  return avgD > 18 ? "超大孔聚集" : "品相一致型";
}

export function buildSpectrumFromArchive(archive: ArchivedBatch[]): SpectrumEntry[] {
  if (archive.length === 0) return MOCK_SPECTRUM;
  return archive.map((a) => {
    const tags = defectSummary(a.defects, a.diagnosis.crackCount);
    return {
      id: `sp-${a.id}`,
      label: spectrumLabel(tags, a.report.grade, a.diagnosis.avgDiameter),
      defectTags: tags.length === 0 ? [] : tags,
      grade: a.report.grade,
      previewHoles: a.holes.slice(0, 60).map((h) => ({ ...h })),
      batchId: a.batch.id,
      batchNo: a.batch.batchNo,
      cheeseType: a.batch.cheeseType,
      productionDate: a.batch.productionDate,
      porosityRate: a.diagnosis.porosityRate,
      thumbnailData: a.thumbnailData,
      mainDefectSummary: tags.length === 0 ? "无结构缺陷" : tags.map((t) =>
        t === "early_blister" ? "早期胀包" :
        t === "late_crack" ? "晚期裂纹" :
        t === "uneven" ? "分布不均" :
        t === "collapsed" ? "孔洞塌陷" : t
      ).join(" / "),
      archivedAt: a.archivedAt,
    } as SpectrumEntry;
  }).reverse();
}

interface BatchState {
  batch: Batch;
  holes: Hole[];
  defects: Defect[];
  diagnosis: Diagnosis | null;
  report: Report | null;
  detected: boolean;
  image: CrossSectionImage | null;
  archive: ArchivedBatch[];
  imageBrightnessSignature: number;
  setBatch: <K extends keyof Batch>(key: K, value: Batch[K]) => void;
  addTempStage: () => void;
  updateTempStage: (i: number, patch: Partial<TempHumidityStage>) => void;
  removeTempStage: (i: number) => void;
  setImage: (img: CrossSectionImage | null, brightnessSig?: number) => void;
  runDetection: (threshold?: number, minDiameter?: number, seedBias?: number) => void;
  computeAllDiagnosis: () => void;
  generateReport: (inspector?: string) => void;
  archiveAndNew: (thumbnail: string) => string | null;
  getArchivedById: (id: string) => ArchivedBatch | undefined;
  loadArchived: (id: string) => void;
  deleteArchived: (id: string) => void;
  resetBatch: () => void;
}

const initial = loadPersist();
const initialBatch = initial?.batch ?? { ...DEFAULT_BATCH, batchNo: generateBatchNo() };

export const useBatchStore = create<BatchState>((set, get) => ({
  batch: initialBatch,
  holes: initial?.holes ?? [],
  defects: initial?.defects ?? [],
  diagnosis: initial?.diagnosis ?? null,
  report: initial?.report ?? null,
  detected: initial?.detected ?? false,
  image: initial?.image ?? null,
  archive: loadArchive(),
  imageBrightnessSignature: 0,

  setBatch: (key, value) =>
    set((s) => {
      const newBatch = { ...s.batch, [key]: value };
      if (key === "cheeseType" || key === "productionDate") {
        newBatch.batchNo = generateBatchNo();
      }
      savePersist({
        batch: newBatch,
        holes: s.holes,
        defects: s.defects,
        diagnosis: s.diagnosis,
        report: null,
        detected: s.detected,
        image: s.image,
      });
      return { batch: newBatch, report: null };
    }),

  addTempStage: () =>
    set((s) => {
      const newBatch = {
        ...s.batch,
        tempHumidityStages: [
          ...s.batch.tempHumidityStages,
          { name: `阶段 ${s.batch.tempHumidityStages.length + 1}`, temperature: 20, humidity: 85, durationHours: 24 },
        ],
      };
      savePersist({
        batch: newBatch,
        holes: s.holes,
        defects: s.defects,
        diagnosis: s.diagnosis,
        report: s.report,
        detected: s.detected,
        image: s.image,
      });
      return { batch: newBatch };
    }),

  updateTempStage: (i, patch) =>
    set((s) => {
      const newBatch = {
        ...s.batch,
        tempHumidityStages: s.batch.tempHumidityStages.map((st, idx) =>
          idx === i ? { ...st, ...patch } : st
        ),
      };
      savePersist({
        batch: newBatch,
        holes: s.holes,
        defects: s.defects,
        diagnosis: s.diagnosis,
        report: s.report,
        detected: s.detected,
        image: s.image,
      });
      return { batch: newBatch };
    }),

  removeTempStage: (i) =>
    set((s) => {
      const newBatch = {
        ...s.batch,
        tempHumidityStages: s.batch.tempHumidityStages.filter((_, idx) => idx !== i),
      };
      savePersist({
        batch: newBatch,
        holes: s.holes,
        defects: s.defects,
        diagnosis: s.diagnosis,
        report: s.report,
        detected: s.detected,
        image: s.image,
      });
      return { batch: newBatch };
    }),

  setImage: (img, brightnessSig = 0) =>
    set((s) => {
      savePersist({
        batch: s.batch,
        holes: s.holes,
        defects: s.defects,
        diagnosis: s.diagnosis,
        report: s.report,
        detected: s.detected,
        image: img,
      });
      return { image: img, imageBrightnessSignature: brightnessSig };
    }),

  runDetection: (threshold = 128, minDiameter = 1.5, seedBias = 0) => {
    const batchId = get().batch.id;
    const brightness = get().imageBrightnessSignature;
    const seed = Math.floor(threshold * 3 + minDiameter * 57 + batchId.length * 11 + seedBias + brightness);
    const holes = generateMockHoles(batchId, seed, 72 + Math.floor(threshold / 10) + Math.floor(brightness / 2));
    const filtered = holes.filter((h) => h.diameter >= minDiameter);
    const defectPassRate = 0.35 + (brightness > 128 ? 0.08 : brightness < 80 ? -0.08 : 0);
    const defects = MOCK_DEFECTS.filter((d) => Math.random() > defectPassRate || d.severity !== "severe");
    set({ holes: filtered, defects, detected: true, report: null });
    get().computeAllDiagnosis();
    savePersist({
      batch: get().batch,
      holes: filtered,
      defects,
      diagnosis: get().diagnosis,
      report: null,
      detected: true,
      image: get().image,
    });
  },

  computeAllDiagnosis: () => {
    const { batch, holes, defects } = get();
    if (holes.length === 0) {
      get().runDetection();
      return;
    }
    const d = buildInitialDiagnosis(batch, holes, defects);
    set({ diagnosis: d, report: null });
    savePersist({
      batch: get().batch,
      holes: get().holes,
      defects: get().defects,
      diagnosis: d,
      report: null,
      detected: get().detected,
      image: get().image,
    });
  },

  generateReport: (inspector = "张师傅") => {
    const { batch, holes, defects, diagnosis } = get();
    let d = diagnosis;
    if (!d) {
      get().computeAllDiagnosis();
      d = get().diagnosis!;
    }
    const normalRatio = holes.length > 0 ? d.normalHoleCount / holes.length : 0;
    const defectFree =
      holes.length + defects.length > 0
        ? Math.max(
            0,
            1 - (d.blisterCount + d.crackCount) / Math.max(1, Math.min(15, holes.length / 5))
          )
        : 1;
    const rs: RadarScores = computeRadarScores({
      porosity: d.porosityRate,
      porosityMin: d.porosityTargetMin,
      porosityMax: d.porosityTargetMax,
      uniformity: d.uniformityScore,
      normalRatio,
      defectFree,
      avgDiameter: d.avgDiameter,
    });
    const total = computeTotalScore(rs);
    const grade = computeGrade(total);
    const report: Report = {
      batchId: batch.id,
      totalScore: total,
      grade,
      radarScores: rs,
      conclusion: generateConclusion(batch, d, grade, total),
      suggestions: generateSuggestions(batch, d, rs),
      inspector,
      issuedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    set({ report });
    savePersist({
      batch: get().batch,
      holes: get().holes,
      defects: get().defects,
      diagnosis: get().diagnosis,
      report,
      detected: get().detected,
      image: get().image,
    });
  },

  archiveAndNew: (thumbnail) => {
    const { batch, holes, defects, diagnosis, report, image } = get();
    if (!diagnosis || !report) {
      alert("请先生成分级报告后再入档");
      return null;
    }
    const id = `A-${Date.now()}`;
    const archived: ArchivedBatch = {
      id,
      archivedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      batch: { ...batch },
      holes: [...holes],
      defects: [...defects],
      diagnosis: { ...diagnosis },
      report: { ...report },
      image: image ? { ...image } : undefined,
      thumbnailData: thumbnail,
    };
    const list = [...get().archive, archived];
    saveArchive(list);
    const newBatch = { ...DEFAULT_BATCH, batchNo: generateBatchNo(), id: `B-${Date.now()}` };
    set({
      archive: list,
      batch: newBatch,
      holes: [],
      defects: [],
      diagnosis: null,
      report: null,
      detected: false,
      image: null,
      imageBrightnessSignature: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
    return id;
  },

  getArchivedById: (id) => get().archive.find((a) => a.id === id),

  loadArchived: (id) => {
    const a = get().archive.find((x) => x.id === id);
    if (!a) return;
    set({
      batch: { ...a.batch },
      holes: [...a.holes],
      defects: [...a.defects],
      diagnosis: { ...a.diagnosis },
      report: { ...a.report },
      detected: true,
      image: a.image ? { ...a.image } : null,
    });
    savePersist({
      batch: { ...a.batch },
      holes: [...a.holes],
      defects: [...a.defects],
      diagnosis: { ...a.diagnosis },
      report: { ...a.report },
      detected: true,
      image: a.image ? { ...a.image } : null,
    });
  },

  deleteArchived: (id) => {
    const list = get().archive.filter((a) => a.id !== id);
    saveArchive(list);
    set({ archive: list });
  },

  resetBatch: () => {
    const newBatch = { ...DEFAULT_BATCH, batchNo: generateBatchNo(), id: `B-${Date.now()}` };
    set({
      batch: newBatch,
      holes: [],
      defects: [],
      diagnosis: null,
      report: null,
      detected: false,
      image: null,
      imageBrightnessSignature: 0,
    });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
