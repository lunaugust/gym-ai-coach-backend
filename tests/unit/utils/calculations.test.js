const { computeBmiMetric } = require('../../../src/utils/calculations');

describe('utils/calculations computeBmiMetric', () => {
  it('returns expected BMI rounded to one decimal', () => {
    // 80kg, 1.80m => 24.7
    expect(computeBmiMetric(80, 180)).toBe(24.7);
  });

  it('returns null for invalid inputs', () => {
    expect(computeBmiMetric(null, 180)).toBeNull();
    expect(computeBmiMetric(80, null)).toBeNull();
    expect(computeBmiMetric(80, 0)).toBeNull();
  });
});


