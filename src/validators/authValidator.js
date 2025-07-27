const Joi = require('joi');

// Custom error message for the password complexity
const passwordComplexityMessages = {
  'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
};

/**
 * Joi schema for user registration.
 * Validates the body of the POST /api/auth/register request.
 */
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\|,.<>/?`~])/)
    .required()
    .messages({ ...passwordComplexityMessages, 'string.min': 'Password must be at least 8 characters long.' }),
  name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters long.',
    'any.required': 'Name is required.',
  }),
  age: Joi.number().integer().min(13).max(100).optional(),
  weight: Joi.number().min(30).max(300).optional(),
  height: Joi.number().min(100).max(250).optional(),
  goal: Joi.string().valid('muscle_gain', 'weight_loss', 'strength', 'endurance').optional(),
  experience_level: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
});

/**
 * Joi schema for user login.
 * Validates the body of the POST /api/auth/login request.
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Joi schema for token refresh.
 * Validates the body of the POST /api/auth/refresh request.
 */
const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};