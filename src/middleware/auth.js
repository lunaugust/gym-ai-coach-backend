const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware to authenticate user by validating JWT access token.
 * If the token is valid, it attaches the decoded payload to `req.user`.
 */
const auth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication token is required.', 'UNAUTHENTICATED'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach payload { userId, email, name } to the request
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED'));
    }
    return next(new ApiError(401, 'Invalid token. Please log in again.', 'INVALID_TOKEN'));
  }
});

module.exports = auth;