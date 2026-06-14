import type { Batch, Defect, SpectrumEntry } from "../types";

export const DEFAULT_BATCH: Batch = {
  id: "B-2026-0042",
  batchNo: "CH-2026-0615-042",
  cheeseType: "埃曼塔尔",
  productionDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  ripeningDays: 45,
  strain: "Propionibacterium freudenreichii",
  theoreticalGas: 120,
  measuredGas: 108,
  inoculation: 1.2,
  salinity: 1.6,
  pH: 5.35,
  titratableAcid: 15,
  tempHumidityStages: [
    { name: "预酸化", temperature: 32, humidity: 85, durationHours: 6 },
    { name: "凝乳成型", temperature: 38, humidity: 80, durationHours: 2 },
    { name: "热烫", temperature: 52, humidity: 75, durationHours: 1 },
    { name: "压制", temperature: 22, humidity: 80, durationHours: 18 },
    { name: "盐渍", temperature: 12, humidity: 88, durationHours: 24 },
    { name: "暖房熟成", temperature: 23, humidity: 88, durationHours: 240 },
    { name: "低温稳定", temperature: 8, humidity: 90, durationHours: 720 },
  ],
};

export const MOCK_DEFECTS: Defect[] = [
  {
    id: "d1",
    batchId: "B-2026-0042",
    type: "early_blister",
    posX: 0.18,
    posY: 0.22,
    size: 28,
    severity: "mild",
    label: "早期胀包·皮下气泡",
  },
  {
    id: "d2",
    batchId: "B-2026-0042",
    type: "late_crack",
    posX: 0.72,
    posY: 0.68,
    size: 42,
    severity: "medium",
    label: "晚期裂纹·放射状",
  },
  {
    id: "d3",
    batchId: "B-2026-0042",
    type: "late_crack",
    posX: 0.55,
    posY: 0.35,
    size: 22,
    severity: "mild",
    label: "晚期裂纹·网状",
  },
];

export const MOCK_SPECTRUM: SpectrumEntry[] = [
  {
    id: "s1",
    label: "正常均匀孔型",
    defectTags: [],
    grade: "A",
    previewHoles: [],
  },
  {
    id: "s2",
    label: "中心密孔·轻度",
    defectTags: ["uneven"],
    grade: "B",
    previewHoles: [],
  },
  {
    id: "s3",
    label: "早期皮下胀包",
    defectTags: ["early_blister"],
    grade: "B",
    previewHoles: [],
  },
  {
    id: "s4",
    label: "晚期放射裂纹",
    defectTags: ["late_crack"],
    grade: "C",
    previewHoles: [],
  },
  {
    id: "s5",
    label: "裂隙网络·严重",
    defectTags: ["late_crack", "collapsed"],
    grade: "C",
    previewHoles: [],
  },
  {
    id: "s6",
    label: "微孔过多·发酵不足",
    defectTags: ["uneven"],
    grade: "B",
    previewHoles: [],
  },
  {
    id: "s7",
    label: "超大孔聚集",
    defectTags: ["uneven"],
    grade: "B",
    previewHoles: [],
  },
  {
    id: "s8",
    label: "孔洞塌陷·杂菌污染",
    defectTags: ["collapsed", "early_blister"],
    grade: "C",
    previewHoles: [],
  },
];

export function generateBatchNo(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rnd = String(Math.floor(100 + Math.random() * 900));
  return `CH-${d.getFullYear()}-${mm}${dd}-${rnd}`;
}
