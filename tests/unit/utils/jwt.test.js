const jwt = require('jsonwebtoken');
const { generateTokens,  generateAccessToken, generateRefreshToken } = require('../../../src/utils/jwt');
const { createMinimalUserData } = require('../../factories/userFactory');

// Mock environment variables for JWT
const JWT_SECRET = 'test-secret-for-jwt-util';
const JWT_REFRESH_SECRET = 'test-refresh-secret-for-jwt-util';
const JWT_ACCESS_EXPIRATION = '10m';
const JWT_REFRESH_EXPIRATION = '7d';

describe('Unit Tests: JWT Utility', () => {
  let originalEnv;

  beforeAll(() => {
    // Store original environment variables and set mocks
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
    process.env.JWT_ACCESS_EXPIRATION = JWT_ACCESS_EXPIRATION;
    process.env.JWT_REFRESH_EXPIRATION = JWT_REFRESH_EXPIRATION;
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('generateTokens', () => {
    it('should generate a valid access and refresh token with correct payloads', () => {
      const user = createMinimalUserData({ id: 'user-123' });
      const { accessToken, refreshToken } = generateTokens(user);

      // Assert tokens are generated and are strings
      expect(accessToken).toBeString();
      expect(refreshToken).toBeString();

      // Verify Access Token payload and signature
      const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET);
      expect(decodedAccessToken.userId).toBe(user.id);
      expect(decodedAccessToken.email).toBe(user.email);
      expect(decodedAccessToken.name).toBe(user.name);
      expect(decodedAccessToken.exp).toBeDefined();

      // Verify Refresh Token payload and signature
      const decodedRefreshToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      expect(decodedRefreshToken.userId).toBe(user.id);
      expect(decodedRefreshToken.email).toBeUndefined(); // Refresh token should have a minimal payload
      expect(decodedRefreshToken.exp).toBeDefined();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token with the correct payload and expiration', () => {
      const payload = { userId: 'abc', email: 'test@example.com', name: 'Test User' };
      const token = generateAccessToken(payload);
      expect(token).toBeString();
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with the correct payload and expiration', () => {
      const payload = { userId: 'xyz' };
      const token = generateRefreshToken(payload);
      expect(token).toBeString();
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.exp).toBeDefined();
      expect(decoded.email).toBeUndefined();
      expect(decoded.name).toBeUndefined();
    });
  });

  describe('Token Verification Scenarios', () => {
    it('should throw TokenExpiredError for an expired token', async () => {
      const expiredToken = jwt.sign({ data: 'payload' }, JWT_SECRET, { expiresIn: '1ms' });
      await new Promise((resolve) => setTimeout(resolve, 5)); // Wait for token to expire

      expect(() => jwt.verify(expiredToken, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
    });

    it('should throw JsonWebTokenError for a token with an invalid signature', () => {
      const token = jwt.sign({ data: 'payload' }, JWT_SECRET, { expiresIn: '1h' });
      const wrongSecret = 'this-is-the-wrong-secret';

      expect(() => jwt.verify(token, wrongSecret)).toThrow('invalid signature');
    });

    it('should throw JsonWebTokenError for a malformed token', () => {
      const malformedToken = 'this.is.not.a.valid.token';
      expect(() => jwt.verify(malformedToken, JWT_SECRET)).toThrow(jwt.JsonWebTokenError);
    });
  });
});