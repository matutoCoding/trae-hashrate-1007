export type CheeseType = "埃曼塔尔" | "格鲁耶尔" | "孔泰" | "大孔" | "瑞士" | "其他";

export type StrainType =
  | "Propionibacterium freudenreichii"
  | "Propionibacterium shermanii"
  | "Propionibacterium jensenii"
  | "混合丙酸菌"
  | "传统天然发酵";

export type HoleCategory = "micro" | "small" | "medium" | "large" | "xlarge" | "crack";

export type DefectType = "early_blister" | "late_crack" | "uneven" | "collapsed";

export type SeverityLevel = "mild" | "medium" | "severe";

export type RiskLevel = "green" | "yellow" | "orange" | "red";

export type Grade = "A" | "B" | "C";

export interface TempHumidityStage {
  name: string;
  temperature: number;
  humidity: number;
  durationHours: number;
}

export interface Batch {
  id: string;
  batchNo: string;
  cheeseType: CheeseType;
  productionDate: string;
  ripeningDays: number;
  strain: StrainType;
  theoreticalGas: number;
  measuredGas: number;
  inoculation: number;
  salinity: number;
  pH: number;
  titratableAcid: number;
  tempHumidityStages: TempHumidityStage[];
}

export interface Hole {
  id: string;
  batchId: string;
  centerX: number;
  centerY: number;
  diameter: number;
  area: number;
  circularity: number;
  aspectRatio: number;
  category: HoleCategory;
  isNormal: boolean;
}

export interface Defect {
  id: string;
  batchId: string;
  type: DefectType;
  posX: number;
  posY: number;
  size: number;
  severity: SeverityLevel;
  label: string;
}

export interface Diagnosis {
  batchId: string;
  porosityRate: number;
  porosityTargetMin: number;
  porosityTargetMax: number;
  porosityPass: boolean;
  propionibacteriumActivity: number;
  contaminationRisk: RiskLevel;
  normalHoleCount: number;
  crackCount: number;
  blisterCount: number;
  avgDiameter: number;
  uniformityScore: number;
  cvCoefficient: number;
  giniCoefficient: number;
  holeTimeMapping: {
    inoculationDay: number;
    startDay: number;
    expansionDay: number;
    stableDay: number;
  };
}

export interface RadarScores {
  porosity: number;
  uniformity: number;
  normalRatio: number;
  defectFree: number;
  sizeTarget: number;
  color: number;
}

export interface Report {
  batchId: string;
  totalScore: number;
  grade: Grade;
  radarScores: RadarScores;
  conclusion: string;
  suggestions: string[];
  inspector: string;
  issuedAt: string;
}

export interface TrendPoint {
  day: number;
  avgDiameter: number;
  porosityRate: number;
  abnormalRatio: number;
}

export interface SpectrumEntry {
  id: string;
  label: string;
  defectTags: DefectType[];
  grade: Grade;
  previewHoles: Partial<Hole>[];
  batchId?: string;
  batchNo?: string;
  cheeseType?: CheeseType;
  productionDate?: string;
  porosityRate?: number;
  thumbnailData?: string;
  mainDefectSummary?: string;
  archivedAt?: string;
}

export interface CrossSectionImage {
  id: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  dataUrl: string;
  uploadedAt: string;
  source: "upload" | "sample";
  sampleIndex?: number;
}

export interface ArchivedBatch {
  id: string;
  archivedAt: string;
  batch: Batch;
  holes: Hole[];
  defects: Defect[];
  diagnosis: Diagnosis;
  report: Report;
  image?: CrossSectionImage;
  thumbnailData: string;
}

export const HOLE_CATEGORY_THRESHOLDS: Record<HoleCategory, [number, number]> = {
  micro: [0, 3],
  small: [3, 8],
  medium: [8, 16],
  large: [16, 25],
  xlarge: [25, Infinity],
  crack: [-1, -1],
};

export const HOLE_CATEGORY_LABELS: Record<HoleCategory, string> = {
  micro: "微孔",
  small: "小孔",
  medium: "中孔",
  large: "大孔",
  xlarge: "超大孔",
  crack: "裂隙",
};

export const CHEESE_TYPES: CheeseType[] = ["埃曼塔尔", "格鲁耶尔", "孔泰", "大孔", "瑞士", "其他"];

export const STRAIN_TYPES: StrainType[] = [
  "Propionibacterium freudenreichii",
  "Propionibacterium shermanii",
  "Propionibacterium jensenii",
  "混合丙酸菌",
  "传统天然发酵",
];
