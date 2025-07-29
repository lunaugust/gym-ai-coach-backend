const authService = require('../../../src/services/authService');
const prisma = require('../../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateTokens } = require('../../../src/utils/jwt');
const { createMinimalUserData } = require('../../factories/userFactory');
const ApiError = require('../../../src/utils/ApiError');

// Mock the modules that authService depends on
jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
}));
jest.mock('bcryptjs');
jest.mock('../../../src/utils/jwt');
jest.mock('jsonwebtoken');


describe('Unit Tests: AuthService', () => {
  let originalEnv;

  // Mock environment variables before all tests in this suite
  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.JWT_REFRESH_EXPIRATION = '7d';
  });

  // Restore original environment variables after all tests
  afterAll(() => {
    process.env = originalEnv;
  });
  
  // Clear all mocks before each test to ensure a clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user and return user data with tokens', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const hashedPassword = 'hashed_password_string';
      const mockTokens = { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' };
      // This is the user object that prisma.user.create would return
      const createdUser = { ...userData, id: 'user-id-123', password: hashedPassword };

      // Configure the mocks' behavior for this specific test
      prisma.user.findUnique.mockResolvedValue(null); // Simulate user does not exist
      bcrypt.hash.mockResolvedValue(hashedPassword);
      prisma.user.create.mockResolvedValue(createdUser);
      generateTokens.mockReturnValue(mockTokens);
      prisma.refreshToken.create.mockResolvedValue({}); // Simulate successful token storage

      // --- Act ---
      const result = await authService.register(userData);

      // --- Assert ---
      // Verify that all dependent functions were called with the correct arguments
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      expect(generateTokens).toHaveBeenCalledWith(createdUser);
      expect(prisma.refreshToken.create).toHaveBeenCalled();

      // Verify that the final output is correctly formatted
      const { password, ...userWithoutPassword } = createdUser;
      expect(result).toEqual({
        user: userWithoutPassword,
        tokens: mockTokens,
      });
    });

    it('should throw an ApiError with 409 status if email already exists', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      // Configure prisma.user.findUnique to return an existing user
      prisma.user.findUnique.mockResolvedValue(userData);

      // --- Act & Assert ---
      // Expect the register function to reject with a specific ApiError
      await expect(authService.register(userData)).rejects.toThrow(new ApiError(409, 'An account with this email already exists.', 'EMAIL_CONFLICT'));

      // Verify that no further actions were taken after finding the user
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully log in a user and return user data with tokens', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const hashedPassword = 'hashed_password_string';
      const mockTokens = { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' };
      const existingUser = { ...userData, id: 'user-id-123', password: hashedPassword };

      // Configure mock behavior
      prisma.user.findUnique.mockResolvedValue(existingUser);
      bcrypt.compare.mockResolvedValue(true); // Simulate correct password
      generateTokens.mockReturnValue(mockTokens);
      prisma.refreshToken.create.mockResolvedValue({});

      // --- Act ---
      const result = await authService.login(userData.email, userData.password);

      // --- Assert ---
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(userData.password, hashedPassword);
      expect(generateTokens).toHaveBeenCalledWith(existingUser);
      expect(prisma.refreshToken.create).toHaveBeenCalled();

      const { password, ...userWithoutPassword } = existingUser;
      expect(result).toEqual({
        user: userWithoutPassword,
        tokens: mockTokens,
      });
    });

    it('should throw an ApiError with 401 status for an incorrect password', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const hashedPassword = 'hashed_password_string';
      const existingUser = { ...userData, id: 'user-id-123', password: hashedPassword };

      prisma.user.findUnique.mockResolvedValue(existingUser);
      bcrypt.compare.mockResolvedValue(false); // Simulate incorrect password

      // --- Act & Assert ---
      await expect(authService.login(userData.email, 'wrong_password')).rejects.toThrow(
        new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
      );

      // Ensure token generation was not attempted
      expect(generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an ApiError with 401 status for a non-existent email', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      prisma.user.findUnique.mockResolvedValue(null); // Simulate user not found

      // --- Act & Assert ---
      await expect(authService.login(userData.email, userData.password)).rejects.toThrow(
        new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
      );

      // Ensure password comparison and token generation were not attempted
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully and perform token rotation', async () => {
      // --- Arrange ---
      const oldRefreshToken = 'valid-old-refresh-token';
      const decodedPayload = { userId: 'user-id-123' };
      const user = createMinimalUserData({ id: decodedPayload.userId });
      const newTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      // Configure mock behavior
      jwt.verify.mockReturnValue(decodedPayload);
      prisma.refreshToken.findUnique.mockResolvedValue({ token: oldRefreshToken, userId: user.id });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(user);
      generateTokens.mockReturnValue(newTokens);
      prisma.refreshToken.create.mockResolvedValue({});

      // --- Act ---
      const result = await authService.refresh(oldRefreshToken);

      // --- Assert ---
      expect(jwt.verify).toHaveBeenCalledWith(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token: oldRefreshToken } });
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { token: oldRefreshToken } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
      expect(generateTokens).toHaveBeenCalledWith(user);
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({ tokens: newTokens });
    });

    it('should throw 401 if refresh token is not in the database', async () => {
      // --- Arrange ---
      const oldRefreshToken = 'token-not-in-db';
      const decodedPayload = { userId: 'user-id-123' };

      jwt.verify.mockReturnValue(decodedPayload);
      prisma.refreshToken.findUnique.mockResolvedValue(null); // Simulate token not found

      // --- Act & Assert ---
      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(
        new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN')
      );
    });

    it('should throw 401 if user associated with token is not found', async () => {
      // --- Arrange ---
      const oldRefreshToken = 'valid-old-refresh-token';
      const decodedPayload = { userId: 'user-id-123' };

      jwt.verify.mockReturnValue(decodedPayload);
      prisma.refreshToken.findUnique.mockResolvedValue({ token: oldRefreshToken, userId: decodedPayload.userId });
      prisma.user.findUnique.mockResolvedValue(null); // Simulate user not found

      // --- Act & Assert ---
      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(
        new ApiError(401, 'User not found.', 'USER_NOT_FOUND')
      );
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for a given user id', async () => {
      // --- Arrange ---
      const userId = 'user-to-logout-123';
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 }); // Simulate deleting 3 tokens

      // --- Act ---
      await authService.logout(userId);

      // --- Assert ---
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });
    });
  });
});