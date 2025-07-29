const auth = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const ApiError = require('../../../src/utils/ApiError');

// Mock the jsonwebtoken library to control its behavior
jest.mock('jsonwebtoken');

describe('Unit Tests: Auth Middleware', () => {
  let req;
  let res; // res is not used by the middleware, but it's good practice to have it
  let next;

  // Reset mocks and request/response/next objects before each test
  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() and attach user to req if token is valid', async () => {
    // --- Arrange ---
    const token = 'valid.jwt.token';
    const decodedPayload = { userId: 'user-123', email: 'test@example.com', name: 'Test User' };
    req.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue(decodedPayload);

    // --- Act ---
    await auth(req, res, next);

    // --- Assert ---
    expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(req.user).toEqual(decodedPayload);
    expect(next).toHaveBeenCalledWith(); // Called with no arguments on success
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next with 401 error if no authorization header is present', async () => {
    // --- Act ---
    await auth(req, res, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Authentication token is required.', 'UNAUTHENTICATED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if header is not in "Bearer <token>" format', async () => {
    // --- Arrange ---
    req.headers.authorization = 'invalid-token-format';

    // --- Act ---
    await auth(req, res, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Authentication token is required.', 'UNAUTHENTICATED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if token is expired', async () => {
    // --- Arrange ---
    req.headers.authorization = 'Bearer expired.jwt.token';
    const expiredError = new jwt.TokenExpiredError('jwt expired', new Date());
    jwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    // --- Act ---
    await auth(req, res, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if token is invalid or malformed', async () => {
    // --- Arrange ---
    req.headers.authorization = 'Bearer invalid.jwt.token';
    const invalidTokenError = new jwt.JsonWebTokenError('invalid token');
    jwt.verify.mockImplementation(() => {
      throw invalidTokenError;
    });

    // --- Act ---
    await auth(req, res, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Invalid token. Please log in again.', 'INVALID_TOKEN');
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});