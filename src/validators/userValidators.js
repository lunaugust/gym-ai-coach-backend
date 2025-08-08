const Joi = require('joi');

const userProfileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/).messages({
    'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes.',
  }),
  age: Joi.number().integer().min(13).max(100),
  weight: Joi.number().min(30).max(300),
  height: Joi.number().min(100).max(250),
  bio: Joi.string().max(500),
  avatar: Joi.string().uri(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
  dateOfBirth: Joi.date().iso().less('now'),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Phone must be a valid international format.',
  }),
  location: Joi.string().max(120),
  timezone: Joi.string(),
});

const fitnessProfileSchema = Joi.object({
  currentWeight: Joi.number().min(30).max(300).allow(null),
  targetWeight: Joi.number().min(30).max(300).allow(null),
  bodyFatPercentage: Joi.number().min(0).max(80).allow(null),
  muscleMass: Joi.number().min(0).max(200).allow(null),

  activityLevel: Joi.string().valid(
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extremely_active'
  ).allow(null),
  workoutFrequency: Joi.number().integer().min(0).max(14).allow(null),
  previousExperience: Joi.string().max(1000).allow('', null),

  injuries: Joi.array().items(Joi.string().max(200)).default([]),
  medicalConditions: Joi.array().items(Joi.string().max(200)).default([]),
  medications: Joi.array().items(Joi.string().max(200)).default([]),

  primaryGoals: Joi.array().items(Joi.string().valid(
    'weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness'
  )).default([]),
  secondaryGoals: Joi.array().items(Joi.string().valid(
    'weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness'
  )).default([]),
  targetDate: Joi.date().iso().greater('now').allow(null),
  motivations: Joi.array().items(Joi.string().max(300)).default([]),
});

const preferencesSchema = Joi.object({
  preferredWorkoutDays: Joi.array().items(Joi.string().valid(
    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
  )).default([]),
  preferredWorkoutTime: Joi.string().valid('morning','afternoon','evening').allow(null),
  sessionDuration: Joi.number().integer().min(5).max(300).allow(null),
  restBetweenSets: Joi.number().integer().min(0).max(600).allow(null),

  availableEquipment: Joi.array().items(Joi.string().valid(
    'dumbbells', 'barbell', 'machines', 'bodyweight', 'bands', 'kettlebell', 'other'
  )).default([]),
  gymAccess: Joi.boolean().default(true),
  homeGymSetup: Joi.boolean().default(false),

  preferredTrainingStyles: Joi.array().items(Joi.string().valid(
    'strength', 'hypertrophy', 'powerlifting', 'crossfit', 'yoga', 'pilates', 'mobility', 'endurance'
  )).default([]),
  intensityPreference: Joi.string().valid('low','moderate','high','varied').allow(null),
  musicPreference: Joi.array().items(Joi.string().max(50)).default([]),

  dietaryRestrictions: Joi.array().items(Joi.string().max(50)).default([]),
  allergies: Joi.array().items(Joi.string().max(50)).default([]),

  workoutReminders: Joi.boolean().default(true),
  progressUpdates: Joi.boolean().default(true),
  motivationalTips: Joi.boolean().default(true),
  emailNotifications: Joi.boolean().default(true),
  pushNotifications: Joi.boolean().default(true),

  profileVisibility: Joi.string().valid('private','friends','public').default('private'),
  dataSharing: Joi.boolean().default(false),

  units: Joi.string().valid('metric','imperial').default('metric'),
  language: Joi.string().max(10).default('en'),
  theme: Joi.string().valid('light','dark','auto').default('light'),
});

const measurementCreateSchema = Joi.object({
  weight: Joi.number().min(30).max(300).allow(null),
  height: Joi.number().min(100).max(250).allow(null),
  bodyFat: Joi.number().min(0).max(80).allow(null),
  muscleMass: Joi.number().min(0).max(200).allow(null),

  chest: Joi.number().min(0).max(300).allow(null),
  waist: Joi.number().min(0).max(300).allow(null),
  hips: Joi.number().min(0).max(300).allow(null),
  biceps: Joi.number().min(0).max(100).allow(null),
  thighs: Joi.number().min(0).max(150).allow(null),
  neck: Joi.number().min(0).max(80).allow(null),

  bmi: Joi.number().min(0).max(100).allow(null),
  visceralFat: Joi.number().min(0).max(100).allow(null),
  waterWeight: Joi.number().min(0).max(100).allow(null),
  boneMass: Joi.number().min(0).max(100).allow(null),

  frontPhoto: Joi.string().uri().allow(null),
  sidePhoto: Joi.string().uri().allow(null),
  backPhoto: Joi.string().uri().allow(null),

  notes: Joi.string().max(1000).allow('', null),
  recordedAt: Joi.date().iso().max('now').allow(null),
});

const measurementUpdateSchema = measurementCreateSchema.keys({});

module.exports = {
  userProfileUpdateSchema,
  fitnessProfileSchema,
  preferencesSchema,
  measurementCreateSchema,
  measurementUpdateSchema,
};


