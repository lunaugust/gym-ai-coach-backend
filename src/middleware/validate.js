const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * A middleware factory that returns a middleware to validate the request body against a Joi schema.
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @returns {Function} Express middleware.
 */
const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false, // Return all validation errors, not just the first one
    stripUnknown: true, // Remove properties that are not in the schema
  });

  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return next(new ApiError(400, 'Validation Failed', 'VALIDATION_ERROR', errorDetails));
  }

  req.body = value; // Replace request body with validated value
  return next();
};

module.exports = validate;