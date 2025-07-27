/**
 * Custom error class for API-related errors.
 * @extends Error
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - The HTTP status code.
   * @param {string} message - The error message.
   * @param {string} [errorCode='API_ERROR'] - A custom, machine-readable error code.
   * @param {Array} [details=[]] - An array of detailed error messages, e.g., from validation.
   */
  constructor(statusCode, message, errorCode = 'API_ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.success = false;
  }
}

module.exports = ApiError;