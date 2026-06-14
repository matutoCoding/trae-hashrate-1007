import type { Grade, RadarScores, Diagnosis, Batch } from "../types";

export function computeRadarScores(params: {
  porosity: number;
  porosityMin: number;
  porosityMax: number;
  uniformity: number;
  normalRatio: number;
  defectFree: number;
  avgDiameter: number;
  targetDiameter?: number;
  color?: number;
}): RadarScores {
  const targetD = params.targetDiameter ?? 12;
  const color = params.color ?? 85;

  let porosityScore = 50;
  if (params.porosity >= params.porosityMin && params.porosity <= params.porosityMax) {
    const mid = (params.porosityMin + params.porosityMax) / 2;
    porosityScore = 100 - Math.abs(params.porosity - mid) / ((params.porosityMax - params.porosityMin) / 2) * 20;
  } else if (params.porosity < params.porosityMin) {
    porosityScore = Math.max(0, 100 - (params.porosityMin - params.porosity) * 4);
  } else {
    porosityScore = Math.max(0, 100 - (params.porosity - params.porosityMax) * 3.5);
  }

  let sizeScore = 50;
  if (params.avgDiameter >= targetD * 0.6 && params.avgDiameter <= targetD * 1.6) {
    sizeScore = 100 - Math.abs(params.avgDiameter - targetD) / targetD * 35;
  } else if (params.avgDiameter < targetD * 0.6) {
    sizeScore = Math.max(0, 60 - (targetD * 0.6 - params.avgDiameter) * 5);
  } else {
    sizeScore = Math.max(0, 70 - (params.avgDiameter - targetD * 1.6) * 3);
  }

  return {
    porosity: Math.max(0, Math.min(100, Math.round(porosityScore))),
    uniformity: Math.max(0, Math.min(100, Math.round(params.uniformity))),
    normalRatio: Math.max(0, Math.min(100, Math.round(params.normalRatio * 100))),
    defectFree: Math.max(0, Math.min(100, Math.round(params.defectFree * 100))),
    sizeTarget: Math.max(0, Math.min(100, Math.round(sizeScore))),
    color: Math.max(0, Math.min(100, Math.round(color))),
  };
}

export function computeTotalScore(rs: RadarScores): number {
  return Math.round(
    rs.porosity * 0.25 +
      rs.uniformity * 0.2 +
      rs.normalRatio * 0.2 +
      rs.defectFree * 0.15 +
      rs.sizeTarget * 0.1 +
      rs.color * 0.1
  );
}

export function computeGrade(totalScore: number): Grade {
  if (totalScore >= 85) return "A";
  if (totalScore >= 70) return "B";
  return "C";
}

export function generateConclusion(batch: Batch, diagnosis: Diagnosis, grade: Grade, score: number): string {
  const variety = batch.cheeseType;
  const porosityStatus = diagnosis.porosityPass ? "孔洞率达标" : "孔洞率不达标";
  const activityText =
    diagnosis.propionibacteriumActivity >= 75
      ? "丙酸菌活性优异"
      : diagnosis.propionibacteriumActivity >= 50
      ? "丙酸菌活性正常"
      : diagnosis.propionibacteriumActivity >= 30
      ? "丙酸菌活性偏低"
      : "丙酸菌活性不足";
  const defectText =
    diagnosis.blisterCount + diagnosis.crackCount === 0
      ? "未检出结构性缺陷"
      : `检出胀包 ${diagnosis.blisterCount} 处、裂纹 ${diagnosis.crackCount} 处`;
  const gradeDesc = { A: "特级品，品相优秀", B: "优良品，符合标准", C: "合格品，建议改良工艺" }[grade];
  return `本批次「${variety}」综合得分为 ${score} 分，评定为${grade}级。${porosityStatus}，${activityText}，${defectText}。${gradeDesc}。`;
}

export function generateSuggestions(
  batch: Batch,
  diagnosis: Diagnosis,
  rs: RadarScores
): string[] {
  const sug: string[] = [];
  if (!diagnosis.porosityPass) {
    if (diagnosis.porosityRate < diagnosis.porosityTargetMin) {
      sug.push("孔洞率偏低：建议提高接种量 10%~15% 或延长暖房熟成 2~3 天，确认产气量是否达到理论值。");
    } else {
      sug.push("孔洞率偏高：建议降低接种量或缩短丙酸发酵阶段时长，必要时提前转入低温稳定。");
    }
  }
  if (diagnosis.propionibacteriumActivity < 50) {
    sug.push("丙酸菌活性不足：检查菌种活力与传代次数，确认暖房温度是否稳定维持在 20~24℃。");
  }
  if (rs.uniformity < 75) {
    sug.push("孔洞分布均匀度较差：检查压模压力、盐渍均匀性与温场分布，建议翻酪周期缩短至 48h。");
  }
  if (rs.normalRatio < 80) {
    sug.push("异常孔/裂隙占比较高：排查凝乳切割粒度、热烫温度与加压时机，避免过早或过晚压制。");
  }
  if (diagnosis.blisterCount > 0) {
    sug.push(`检出早期胀包缺陷 ${diagnosis.blisterCount} 处：检查压制阶段排气是否充分，盐渍前是否存在皮下水汽滞留。`);
  }
  if (diagnosis.crackCount > 0) {
    sug.push(`检出晚期裂纹缺陷 ${diagnosis.crackCount} 处：注意熟成后期湿度维持在 88%~92%，避免快速降温导致的皮质收缩。`);
  }
  if (diagnosis.contaminationRisk === "orange" || diagnosis.contaminationRisk === "red") {
    sug.push(`杂菌产气风险${diagnosis.contaminationRisk === "red" ? "高" : "偏高"}：建议复核盐度（目标≥1.5%）与滴定酸度（目标≥14°D），必要时延长预酸化时间。`);
  }
  if (rs.sizeTarget < 70) {
    sug.push("平均孔径偏离目标：调整暖房阶段时长或温度±1℃以调控扩孔速率，记录后与下一批对比。");
  }
  if (sug.length === 0) {
    sug.push("本批次各项指标均在理想区间，建议保持现有工艺参数并做好批次记录。");
  }
  return sug;
}
