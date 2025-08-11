import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import auth from '../../../src/middleware/auth';
import ApiError from '../../../src/utils/ApiError';

// Mock the jsonwebtoken library to control its behavior BEFORE requiring the middleware
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Unit Tests: Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>; // res is not used by the middleware, but it's good practice to have it
  let next: jest.MockedFunction<NextFunction>;

  // Reset mocks and request/response/next objects before each test
  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() and attach user to req if token is valid', async () => {
    // --- Arrange ---
    const token = 'valid.jwt.token';
    const decodedPayload = { userId: 'user-123', email: 'test@example.com', name: 'Test User' };
    req.headers = { authorization: `Bearer ${token}` };
    mockedJwt.verify.mockReturnValue(decodedPayload as any);

    // --- Act ---
    await auth(req as Request, res as Response, next);

    // --- Assert ---
    expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
    expect(req.user).toEqual(decodedPayload);
    expect(next).toHaveBeenCalledWith(); // Called with no arguments on success
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next with 401 error if no authorization header is present', async () => {
    // --- Act ---
    await auth(req as Request, res as Response, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Authentication token is required.', 'UNAUTHENTICATED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if header is not in "Bearer <token>" format', async () => {
    // --- Arrange ---
    req.headers = { authorization: 'invalid-token-format' };

    // --- Act ---
    await auth(req as Request, res as Response, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Authentication token is required.', 'UNAUTHENTICATED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if token is expired', async () => {
    // --- Arrange ---
    req.headers = { authorization: 'Bearer expired.jwt.token' };
    const expiredError = new mockedJwt.TokenExpiredError('jwt expired', new Date());
    mockedJwt.verify.mockImplementation(() => {
      throw expiredError;
    });

    // --- Act ---
    await auth(req as Request, res as Response, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    expect(next).toHaveBeenCalledWith(expectedError);
  });

  it('should call next with 401 error if token is invalid or malformed', async () => {
    // --- Arrange ---
    req.headers = { authorization: 'Bearer invalid.jwt.token' };
    const invalidTokenError = new mockedJwt.JsonWebTokenError('invalid token');
    mockedJwt.verify.mockImplementation(() => {
      throw invalidTokenError;
    });

    // --- Act ---
    await auth(req as Request, res as Response, next);

    // --- Assert ---
    const expectedError = new ApiError(401, 'Invalid token. Please log in again.', 'INVALID_TOKEN');
    expect(next).toHaveBeenCalledWith(expectedError);
  });
});
