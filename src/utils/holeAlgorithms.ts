import type { Hole, HoleCategory, HOLE_CATEGORY_THRESHOLDS } from "../types";
import { HOLE_CATEGORY_THRESHOLDS as THRESHOLDS } from "../types";

export function categorizeHole(
  diameter: number,
  circularity: number,
  aspectRatio: number
): HoleCategory {
  if (circularity < 0.3 || aspectRatio > 2.5) return "crack";
  if (diameter < 3) return "micro";
  if (diameter < 8) return "small";
  if (diameter < 16) return "medium";
  if (diameter < 25) return "large";
  return "xlarge";
}

export function computePorosity(holes: Hole[], totalAreaPx: number): number {
  if (totalAreaPx <= 0) return 0;
  const totalHoleArea = holes.reduce((sum, h) => sum + h.area, 0);
  return Math.min(100, (totalHoleArea / totalAreaPx) * 100);
}

export function computeGiniCoefficient(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let cumSum = 0;
  let giniSum = 0;
  for (let i = 0; i < n; i++) {
    cumSum += sorted[i];
    giniSum += (i + 1) * sorted[i];
  }
  return (2 * giniSum) / (n * sum) - (n + 1) / n;
}

export function computeUniformity(holes: Hole[], gridCols = 6, gridRows = 6): number {
  const grid: number[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));
  for (const h of holes) {
    const col = Math.min(gridCols - 1, Math.max(0, Math.floor(h.centerX * gridCols)));
    const row = Math.min(gridRows - 1, Math.max(0, Math.floor(h.centerY * gridRows)));
    grid[row][col] += 1;
  }
  const flat = grid.flat();
  const gini = computeGiniCoefficient(flat);
  return Math.max(0, Math.min(100, (1 - gini) * 100));
}

export function computeCVCoefficient(holes: Hole[]): number {
  if (holes.length < 2) return 0;
  const diameters = holes.map((h) => h.diameter);
  const mean = diameters.reduce((a, b) => a + b, 0) / diameters.length;
  if (mean === 0) return 0;
  const variance = diameters.reduce((s, d) => s + (d - mean) ** 2, 0) / diameters.length;
  return (Math.sqrt(variance) / mean) * 100;
}

export function computeDiameterDistribution(
  holes: Hole[]
): Record<HoleCategory, number> {
  const dist: Record<HoleCategory, number> = {
    micro: 0,
    small: 0,
    medium: 0,
    large: 0,
    xlarge: 0,
    crack: 0,
  };
  for (const h of holes) dist[h.category]++;
  return dist;
}

export function computeAverageDiameter(holes: Hole[]): number {
  if (holes.length === 0) return 0;
  return holes.reduce((s, h) => s + h.diameter, 0) / holes.length;
}

export function generateMockHoles(
  batchId: string,
  seed = 42,
  count = 78
): Hole[] {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const holes: Hole[] = [];
  for (let i = 0; i < count; i++) {
    const cx = 0.08 + rnd() * 0.84;
    const cy = 0.08 + rnd() * 0.84;
    const dist = Math.hypot(cx - 0.5, cy - 0.5);
    const diameterBase =
      rnd() < 0.08
        ? 0.5 + rnd() * 2.5
        : rnd() < 0.55
        ? 4 + rnd() * 6
        : rnd() < 0.8
        ? 10 + rnd() * 12
        : 20 + rnd() * 14;
    const diameter = diameterBase * (1 - Math.min(0.35, dist * 0.4));
    const isCrack = rnd() < 0.06;
    const circularity = isCrack ? 0.1 + rnd() * 0.18 : 0.6 + rnd() * 0.38;
    const aspectRatio = isCrack ? 3 + rnd() * 5 : 1 + rnd() * 0.9;
    const area = isCrack
      ? diameter * 1.2 * (diameter / aspectRatio) * 0.785
      : Math.PI * (diameter / 2) ** 2;
    const category = categorizeHole(diameter, circularity, aspectRatio);
    holes.push({
      id: `h-${batchId}-${i}`,
      batchId,
      centerX: cx,
      centerY: cy,
      diameter,
      area,
      circularity,
      aspectRatio,
      category,
      isNormal: category !== "crack" && diameter < 28,
    });
  }
  return holes;
}

export const _thresholds: typeof HOLE_CATEGORY_THRESHOLDS = THRESHOLDS;
