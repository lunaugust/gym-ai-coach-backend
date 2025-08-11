import type { Request, Response, NextFunction } from 'express';
import * as authController from '../../../src/controllers/authController';
import * as authService from '../../../src/services/authService';
import prisma from '../../../src/config/database';
import ApiError from '../../../src/utils/ApiError';
import { createMinimalUserData } from '../../factories/userFactory';

// Mock service and database dependencies used by the controller BEFORE requiring it
jest.mock('../../../src/services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Unit Tests: AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  const waitForNextTick = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    req = { body: {}, user: undefined };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and respond with 201 and payload', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const createdUser = { id: 'user-123', email: userData.email, name: userData.name };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      req.body = userData;
      mockedAuthService.register.mockResolvedValue({ user: createdUser, tokens });

      // --- Act ---
      await authController.register(req as Request, res as Response, next);

      // --- Assert ---
      expect(mockedAuthService.register).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful.',
        data: { user: createdUser, tokens },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const error = new ApiError(409, 'An account with this email already exists.', 'EMAIL_CONFLICT');
      req.body = userData;
      mockedAuthService.register.mockRejectedValue(error);

      // --- Act ---
      await authController.register(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in user and respond with 200 and payload', async () => {
      // --- Arrange ---
      const email = 'test@example.com';
      const password = 'Password123!';
      const user = { id: 'user-123', email, name: 'Test User' };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      req.body = { email, password };
      mockedAuthService.login.mockResolvedValue({ user, tokens });

      // --- Act ---
      await authController.login(req as Request, res as Response, next);

      // --- Assert ---
      expect(mockedAuthService.login).toHaveBeenCalledWith(email, password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful.',
        data: { user, tokens },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const email = 'test@example.com';
      const password = 'Password123!';
      const error = new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
      req.body = { email, password };
      mockedAuthService.login.mockRejectedValue(error);

      // --- Act ---
      await authController.login(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens and respond with 200 and payload', async () => {
      // --- Arrange ---
      const refreshToken = 'refresh-token';
      const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      req.body = { refreshToken };
      mockedAuthService.refresh.mockResolvedValue({ tokens });

      // --- Act ---
      await authController.refresh(req as Request, res as Response, next);

      // --- Assert ---
      expect(mockedAuthService.refresh).toHaveBeenCalledWith(refreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tokens refreshed successfully.',
        data: { tokens },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const refreshToken = 'invalid-token';
      const error = new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN');
      req.body = { refreshToken };
      mockedAuthService.refresh.mockRejectedValue(error);

      // --- Act ---
      await authController.refresh(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user and respond with 204', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      req.user = { userId, email: 'test@example.com', name: 'Test User' };
      mockedAuthService.logout.mockResolvedValue(undefined);

      // --- Act ---
      await authController.logout(req as Request, res as Response, next);

      // --- Assert ---
      expect(mockedAuthService.logout).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      const error = new ApiError(500, 'Database error');
      req.user = { userId, email: 'test@example.com', name: 'Test User' };
      mockedAuthService.logout.mockRejectedValue(error);

      // --- Act ---
      await authController.logout(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile and respond with 200 and payload', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      const user = { id: userId, email: 'test@example.com', name: 'Test User' };
      req.user = { userId, email: 'test@example.com', name: 'Test User' };
      mockedPrisma.user.findUnique.mockResolvedValue(user as any);

      // --- Act ---
      await authController.getProfile(req as Request, res as Response, next);

      // --- Assert ---
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          age: true,
          weight: true,
          height: true,
          goal: true,
          experience_level: true,
          createdAt: true,
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile fetched successfully.',
        data: { user },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when user not found', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      req.user = { userId, email: 'test@example.com', name: 'Test User' };
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      // --- Act ---
      await authController.getProfile(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      const error = new ApiError(500, 'Database error');
      req.user = { userId, email: 'test@example.com', name: 'Test User' };
      mockedPrisma.user.findUnique.mockRejectedValue(error);

      // --- Act ---
      await authController.getProfile(req as Request, res as Response, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
