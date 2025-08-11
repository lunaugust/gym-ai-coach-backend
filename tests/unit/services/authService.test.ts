// Mock dependencies BEFORE importing the module under test
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

import * as authService from '../../../src/services/authService';
import prisma from '../../../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../../../src/utils/jwt';
import { createMinimalUserData } from '../../factories/userFactory';
import ApiError from '../../../src/utils/ApiError';

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedGenerateTokens = generateTokens as jest.MockedFunction<typeof generateTokens>;

describe('Unit Tests: AuthService', () => {
  let originalEnv: NodeJS.ProcessEnv;

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
      mockedPrisma.user.findUnique.mockResolvedValue(null); // Simulate user does not exist
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockedPrisma.user.create.mockResolvedValue(createdUser as any);
      mockedGenerateTokens.mockReturnValue(mockTokens);
      mockedPrisma.refreshToken.create.mockResolvedValue({} as any); // Simulate successful token storage

      // --- Act ---
      const result = await authService.register(userData);

      // --- Assert ---
      // Verify that all dependent functions were called with the correct arguments
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      expect(mockedGenerateTokens).toHaveBeenCalledWith(createdUser);
      expect(mockedPrisma.refreshToken.create).toHaveBeenCalled();

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
      mockedPrisma.user.findUnique.mockResolvedValue(userData as any);

      // --- Act & Assert ---
      // Expect the register function to reject with a specific ApiError
      await expect(authService.register(userData)).rejects.toThrow(new ApiError(409, 'An account with this email already exists.', 'EMAIL_CONFLICT'));

      // Verify that no further actions were taken after finding the user
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(mockedPrisma.user.create).not.toHaveBeenCalled();
      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });

    it('should handle refresh token creation failure and retry', async () => {
      // --- Arrange ---
      const userData = createMinimalUserData();
      const hashedPassword = 'hashed_password_string';
      const mockTokens = { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' };
      const retryTokens = { accessToken: 'retry_access_token', refreshToken: 'retry_refresh_token' };
      const createdUser = { ...userData, id: 'user-id-123', password: hashedPassword };

      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockedPrisma.user.create.mockResolvedValue(createdUser as any);
      mockedGenerateTokens.mockReturnValueOnce(mockTokens).mockReturnValueOnce(retryTokens);
      mockedPrisma.refreshToken.create.mockRejectedValueOnce(new Error('Token creation failed')).mockResolvedValueOnce({} as any);

      // --- Act ---
      const result = await authService.register(userData);

      // --- Assert ---
      expect(mockedGenerateTokens).toHaveBeenCalledTimes(2);
      expect(mockedPrisma.refreshToken.create).toHaveBeenCalledTimes(2);
      expect(result.tokens).toEqual(retryTokens);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // --- Arrange ---
      const email = 'test@example.com';
      const password = 'Password123!';
      const hashedPassword = 'hashed_password_string';
      const user = { id: 'user-id-123', email, password: hashedPassword, name: 'Test User' };
      const mockTokens = { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' };

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedGenerateTokens.mockReturnValue(mockTokens);
      mockedPrisma.refreshToken.create.mockResolvedValue({} as any);

      // --- Act ---
      const result = await authService.login(email, password);

      // --- Assert ---
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockedGenerateTokens).toHaveBeenCalledWith(user);
      expect(result).toEqual({
        user: { id: user.id, email: user.email, name: user.name },
        tokens: mockTokens,
      });
    });

    it('should throw ApiError for non-existent user', async () => {
      // --- Arrange ---
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      mockedPrisma.user.findUnique.mockResolvedValue(null);

      // --- Act & Assert ---
      await expect(authService.login(email, password)).rejects.toThrow(
        new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
      );
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ApiError for incorrect password', async () => {
      // --- Arrange ---
      const email = 'test@example.com';
      const password = 'WrongPassword123!';
      const hashedPassword = 'hashed_password_string';
      const user = { id: 'user-id-123', email, password: hashedPassword, name: 'Test User' };

      mockedPrisma.user.findUnique.mockResolvedValue(user as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // --- Act & Assert ---
      await expect(authService.login(email, password)).rejects.toThrow(
        new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
      );
      expect(mockedGenerateTokens).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      // --- Arrange ---
      const refreshToken = 'valid_refresh_token';
      const userId = 'user-id-123';
      const user = { id: userId, email: 'test@example.com', name: 'Test User' };
      const newTokens = { accessToken: 'new_access_token', refreshToken: 'new_refresh_token' };

      mockedJwt.verify.mockReturnValue({ userId } as any);
      mockedPrisma.refreshToken.findUnique.mockResolvedValue({ token: refreshToken, userId } as any);
      mockedPrisma.user.findUnique.mockResolvedValue(user as any);
      mockedGenerateTokens.mockReturnValue(newTokens);
      mockedPrisma.refreshToken.create.mockResolvedValue({} as any);

      // --- Act ---
      const result = await authService.refresh(refreshToken);

      // --- Assert ---
      expect(mockedJwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_REFRESH_SECRET);
      expect(mockedPrisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token: refreshToken } });
      expect(mockedPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { token: refreshToken } });
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual({ tokens: newTokens });
    });

    it('should throw ApiError for invalid refresh token', async () => {
      // --- Arrange ---
      const refreshToken = 'invalid_refresh_token';

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // --- Act & Assert ---
      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN')
      );
    });

    it('should throw ApiError for non-existent refresh token in database', async () => {
      // --- Arrange ---
      const refreshToken = 'valid_but_not_in_db_token';
      const userId = 'user-id-123';

      mockedJwt.verify.mockReturnValue({ userId } as any);
      mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

      // --- Act & Assert ---
      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN')
      );
    });

    it('should throw ApiError for non-existent user', async () => {
      // --- Arrange ---
      const refreshToken = 'valid_refresh_token';
      const userId = 'user-id-123';

      mockedJwt.verify.mockReturnValue({ userId } as any);
      mockedPrisma.refreshToken.findUnique.mockResolvedValue({ token: refreshToken, userId } as any);
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      // --- Act & Assert ---
      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        new ApiError(401, 'User not found.', 'USER_NOT_FOUND')
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout by deleting all refresh tokens for user', async () => {
      // --- Arrange ---
      const userId = 'user-id-123';

      mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 } as any);

      // --- Act ---
      await authService.logout(userId);

      // --- Assert ---
      expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    });
  });
});
