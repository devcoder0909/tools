// Percentages are entered to hundredths. Keeping the numerator in integer
// hundredths avoids rounding an exact cutoff up by an extra hundredth.
export function requiredFinalGrade(current: number, target: number, weight: number) {
  const w = Math.round(weight * 100);
  return Math.ceil((Math.round(target * 100) * 10000 - Math.round(current * 100) * (10000 - w)) / w) / 100;
}

export function requiredFinalPoints(earned: number, possible: number, examPoints: number, target: number) {
  return Math.ceil(Math.round(target * 100) * (possible + examPoints) / 10000) - earned;
}
