import type { Hole, TrendPoint, RiskLevel } from "../types";
import { computeAverageDiameter, computePorosity } from "./holeAlgorithms";

export function logisticGrowth(x: number, K: number, r: number, x0: number): number {
  return K / (1 + Math.exp(-r * (x - x0)));
}

export function computePropionibacteriumActivity(
  measuredGas: number,
  theoreticalGas: number,
  normalHoleRatio: number,
  avgDiameter: number,
  targetDiameter = 12
): number {
  const gasEfficiency = theoreticalGas > 0 ? Math.min(1, measuredGas / theoreticalGas) : 0;
  const sizeScore =
    avgDiameter >= targetDiameter * 0.6 && avgDiameter <= targetDiameter * 1.5
      ? 1 - Math.abs(avgDiameter - targetDiameter) / targetDiameter
      : 0;
  const activity = gasEfficiency * 0.4 + normalHoleRatio * 0.3 + Math.max(0, sizeScore) * 0.3;
  return Math.max(0, Math.min(100, Math.round(activity * 100)));
}

export function computeContaminationRisk(
  salinity: number,
  pH: number,
  titratableAcid: number
): RiskLevel {
  let score = 0;
  if (salinity < 1.2) score += 2;
  else if (salinity < 1.6) score += 1;
  if (pH > 5.5) score += 2;
  else if (pH > 5.3) score += 1;
  if (titratableAcid < 12) score += 1;
  if (score >= 4) return "red";
  if (score >= 2) return "orange";
  if (score >= 1) return "yellow";
  return "green";
}

export function simulateTrend(
  currentDay: number,
  maxExtensionDays: number,
  currentAvgDiameter: number,
  currentPorosity: number,
  currentAbnormalRatio: number,
  activity: number,
  temperatureFactor = 1.0
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const totalDays = currentDay + maxExtensionDays;
  const K_d = Math.min(30, currentAvgDiameter * 1.8);
  const K_p = Math.min(45, currentPorosity * 1.6);
  const r = (0.05 + activity / 2500) * temperatureFactor;
  const x0 = currentDay + (maxExtensionDays * 0.35);
  for (let d = 0; d <= totalDays; d += Math.max(1, Math.floor(totalDays / 40))) {
    const avgD = currentAvgDiameter + (logisticGrowth(d, K_d - currentAvgDiameter, r, x0));
    const por = currentPorosity + (logisticGrowth(d, K_p - currentPorosity, r * 0.85, x0 + 2));
    const abn = Math.min(
      100,
      currentAbnormalRatio + logisticGrowth(d, 70, r * 1.2, x0 + 8)
    );
    points.push({
      day: d,
      avgDiameter: +avgD.toFixed(2),
      porosityRate: +por.toFixed(2),
      abnormalRatio: +abn.toFixed(2),
    });
  }
  return points;
}

export function computeRiskLevel(
  predictedPorosity: number,
  predictedAbnormalRatio: number,
  targetPorosityMax: number
): RiskLevel {
  if (predictedPorosity > targetPorosityMax * 1.35 || predictedAbnormalRatio > 50) return "red";
  if (predictedPorosity > targetPorosityMax * 1.15 || predictedAbnormalRatio > 30) return "orange";
  if (predictedPorosity > targetPorosityMax || predictedAbnormalRatio > 15) return "yellow";
  return "green";
}

export function riskLabel(level: RiskLevel): string {
  return { green: "安全", yellow: "注意", orange: "告警", red: "危险" }[level];
}

export function riskColor(level: RiskLevel): string {
  return { green: "#4A7C59", yellow: "#D4A017", orange: "#D4742A", red: "#B33951" }[level];
}

export function simulateFutureHoles(
  holes: Hole[],
  scale: number,
  crackGrowth = 1.6
): Hole[] {
  return holes.map((h) => {
    const factor = h.category === "crack" ? 1 + (scale - 1) * crackGrowth : scale;
    const newDiameter = h.diameter * factor;
    return {
      ...h,
      diameter: newDiameter,
      area: h.area * factor * factor,
    };
  });
}

export function generateHoleTimelineMapping(
  ripeningDays: number,
  activity: number
) {
  const base = ripeningDays;
  const speed = 0.6 + activity / 250;
  return {
    inoculationDay: 0,
    startDay: Math.max(2, Math.round(base * 0.12 / speed)),
    expansionDay: Math.max(5, Math.round(base * 0.28 / speed)),
    stableDay: Math.max(base * 0.6, Math.round(base * 0.65 / speed)),
  };
}
