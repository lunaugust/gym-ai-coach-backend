export const computeBmiMetric = (weightKg?: number, heightCm?: number): number | null => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};


