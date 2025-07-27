const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of our custom ApiError, convert it.
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, 'INTERNAL_SERVER_ERROR');
  }

  // Log the error
  logger.error(error);

  // Send the response
  const response = {
    success: false,
    message: error.message,
    error: error.errorCode,
    ...(error.details.length && { details: error.details }),
  };

  // In production, don't expose detailed internal server error messages
  if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
    response.message = 'An unexpected error occurred on the server.';
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;