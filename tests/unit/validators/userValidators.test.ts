import { userProfileUpdateSchema, preferencesSchema, measurementCreateSchema } from '../../../src/validators/userValidators';

describe('validators/userValidators', () => {
  describe('userProfileUpdateSchema', () => {
    it('accepts valid profile fields', () => {
      const { error, value } = userProfileUpdateSchema.validate({ name: 'John Doe', age: 30, bio: 'Hi', timezone: 'UTC' });
      expect(error).toBeUndefined();
      expect(value).toEqual(expect.objectContaining({ name: 'John Doe', age: 30 }));
    });

    it('rejects invalid name characters', () => {
      const { error } = userProfileUpdateSchema.validate({ name: 'Bad@Name' });
      expect(error).toBeDefined();
    });
  });

  describe('preferencesSchema', () => {
    it('accepts allowed enums', () => {
      const { error, value } = preferencesSchema.validate({ units: 'metric', preferredWorkoutDays: ['monday'], intensityPreference: 'moderate' });
      expect(error).toBeUndefined();
      expect(value.units).toBe('metric');
    });

    it('rejects invalid day', () => {
      const { error } = preferencesSchema.validate({ preferredWorkoutDays: ['funday'] });
      expect(error).toBeDefined();
    });
  });

  describe('measurementCreateSchema', () => {
    it('accepts measurement values and allows nulls', () => {
      const { error, value } = measurementCreateSchema.validate({ weight: 80, height: 180, bodyFat: null });
      expect(error).toBeUndefined();
      expect(value).toEqual(expect.objectContaining({ weight: 80, height: 180, bodyFat: null }));
    });
  });
});
