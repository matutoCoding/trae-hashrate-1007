import { create } from "zustand";
import type {
  Batch,
  Hole,
  Defect,
  Diagnosis,
  Report,
  RadarScores,
  TempHumidityStage,
} from "../types";
import { DEFAULT_BATCH, MOCK_DEFECTS, generateBatchNo } from "../utils/mockData";
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

interface BatchState {
  batch: Batch;
  holes: Hole[];
  defects: Defect[];
  diagnosis: Diagnosis | null;
  report: Report | null;
  detected: boolean;
  setBatch: <K extends keyof Batch>(key: K, value: Batch[K]) => void;
  addTempStage: () => void;
  updateTempStage: (i: number, patch: Partial<TempHumidityStage>) => void;
  removeTempStage: (i: number) => void;
  runDetection: (threshold?: number, minDiameter?: number) => void;
  computeAllDiagnosis: () => void;
  generateReport: (inspector?: string) => void;
  resetBatch: () => void;
}

const TARGET_POROSITY_MIN = 10;
const TARGET_POROSITY_MAX = 22;
const TOTAL_AREA_PX = 600 * 600 * 0.72;

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

export const useBatchStore = create<BatchState>((set, get) => ({
  batch: { ...DEFAULT_BATCH, batchNo: generateBatchNo() },
  holes: [],
  defects: [],
  diagnosis: null,
  report: null,
  detected: false,

  setBatch: (key, value) =>
    set((s) => {
      const newBatch = { ...s.batch, [key]: value };
      if (key === "cheeseType" || key === "productionDate") {
        newBatch.batchNo = generateBatchNo();
      }
      return { batch: newBatch, report: null };
    }),

  addTempStage: () =>
    set((s) => ({
      batch: {
        ...s.batch,
        tempHumidityStages: [
          ...s.batch.tempHumidityStages,
          { name: `阶段 ${s.batch.tempHumidityStages.length + 1}`, temperature: 20, humidity: 85, durationHours: 24 },
        ],
      },
    })),

  updateTempStage: (i, patch) =>
    set((s) => ({
      batch: {
        ...s.batch,
        tempHumidityStages: s.batch.tempHumidityStages.map((st, idx) =>
          idx === i ? { ...st, ...patch } : st
        ),
      },
    })),

  removeTempStage: (i) =>
    set((s) => ({
      batch: {
        ...s.batch,
        tempHumidityStages: s.batch.tempHumidityStages.filter((_, idx) => idx !== i),
      },
    })),

  runDetection: (threshold = 128, minDiameter = 1.5) => {
    const batchId = get().batch.id;
    const seed = Math.floor(threshold * 3 + minDiameter * 57 + batchId.length * 11);
    const holes = generateMockHoles(batchId, seed, 72 + Math.floor(threshold / 10));
    const filtered = holes.filter((h) => h.diameter >= minDiameter);
    const defects = MOCK_DEFECTS.filter((d) => Math.random() > 0.35 || d.severity !== "severe");
    set({ holes: filtered, defects, detected: true, report: null });
    get().computeAllDiagnosis();
  },

  computeAllDiagnosis: () => {
    const { batch, holes, defects } = get();
    if (holes.length === 0) {
      get().runDetection();
      return;
    }
    const d = buildInitialDiagnosis(batch, holes, defects);
    set({ diagnosis: d, report: null });
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
  },

  resetBatch: () =>
    set({
      batch: { ...DEFAULT_BATCH, batchNo: generateBatchNo() },
      holes: [],
      defects: [],
      diagnosis: null,
      report: null,
      detected: false,
    }),
}));
