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

const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');
const prisma = require('../../../src/config/database');
const ApiError = require('../../../src/utils/ApiError');
const { createMinimalUserData } = require('../../factories/userFactory');

describe('Unit Tests: AuthController', () => {
  let req;
  let res;
  let next;
  const waitForNextTick = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    req = { body: {}, user: null };
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
      authService.register.mockResolvedValue({ user: createdUser, tokens });

      // --- Act ---
      await authController.register(req, res, next);

      // --- Assert ---
      expect(authService.register).toHaveBeenCalledWith(userData);
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
      authService.register.mockRejectedValue(error);

      // --- Act ---
      await authController.register(req, res, next);
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
      authService.login.mockResolvedValue({ user, tokens });

      // --- Act ---
      await authController.login(req, res, next);

      // --- Assert ---
      expect(authService.login).toHaveBeenCalledWith(email, password);
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
      const password = 'wrong';
      const error = new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
      req.body = { email, password };
      authService.login.mockRejectedValue(error);

      // --- Act ---
      await authController.login(req, res, next);
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
      authService.refresh.mockResolvedValue({ tokens });

      // --- Act ---
      await authController.refresh(req, res, next);

      // --- Assert ---
      expect(authService.refresh).toHaveBeenCalledWith(refreshToken);
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
      const refreshToken = 'bad-refresh-token';
      const error = new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN');
      req.body = { refreshToken };
      authService.refresh.mockRejectedValue(error);

      // --- Act ---
      await authController.refresh(req, res, next);
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
      req.user = { userId };
      authService.logout.mockResolvedValue();

      // --- Act ---
      await authController.logout(req, res, next);

      // --- Assert ---
      expect(authService.logout).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      const error = new Error('Unexpected error');
      req.user = { userId };
      authService.logout.mockRejectedValue(error);

      // --- Act ---
      await authController.logout(req, res, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should fetch profile for authenticated user and respond with 200 and user data', async () => {
      // --- Arrange ---
      const userId = 'user-123';
      req.user = { userId };
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        age: 30,
        weight: 75.5,
        height: 178,
        goal: 'muscle_gain',
        experience_level: 'intermediate',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      };
      prisma.user.findUnique.mockResolvedValue(user);

      // --- Act ---
      await authController.getProfile(req, res, next);

      // --- Assert ---
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
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

    it('should call next with 404 ApiError when user is not found', async () => {
      // --- Arrange ---
      const userId = 'missing-user';
      req.user = { userId };
      prisma.user.findUnique.mockResolvedValue(null);

      // --- Act ---
      await authController.getProfile(req, res, next);
      await waitForNextTick();

      // --- Assert ---
      expect(next).toHaveBeenCalledTimes(1);
      const errorArg = next.mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(ApiError);
      expect(errorArg).toEqual(
        expect.objectContaining({ statusCode: 404, message: 'User not found', errorCode: 'USER_NOT_FOUND' })
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});


