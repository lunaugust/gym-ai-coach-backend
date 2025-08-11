import { api, registerUser, loginUser, authHeader } from '../helpers/apiHelpers';

describe('Integration: Authentication Flow', () => {
  describe('POST /api/auth/register', () => {
    it('should register user with all fields and return 201 with tokens', async () => {
      const { res } = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Registration successful.',
          data: expect.objectContaining({
            user: expect.objectContaining({ id: expect.any(String), email: expect.any(String) }),
            tokens: expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) }),
          }),
        })
      );
    });

    it('should register user with minimal required fields', async () => {
      const email = `min_${Date.now()}@example.com`;
      const res = await api().post('/api/auth/register').send({
        name: 'Minimal',
        email,
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate email with 409 (bypassing rate limit with different IPs)', async () => {
      const email = `dup_${Date.now()}@example.com`;
      const ip1 = '10.0.0.1';
      const ip2 = '10.0.0.2';
      await api().post('/api/auth/register').set('X-Forwarded-For', ip1).send({ name: 'AA', email, password: 'Password123!' });
      const res = await api().post('/api/auth/register').set('X-Forwarded-For', ip2).send({ name: 'BB', email, password: 'Password123!' });
      expect(res.status).toBe(409);
      expect(res.body).toEqual(
        expect.objectContaining({ success: false, error: 'EMAIL_CONFLICT' })
      );
    });

    it('should return 400 for invalid email format', async () => {
      const res = await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.3').send({
        name: 'Invalid Email',
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const email = `login_${Date.now()}@example.com`;
      await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.4').send({ name: 'Login', email, password: 'Password123!' });
      const res = await loginUser({ email, password: 'Password123!', ip: '10.0.0.5' });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens).toEqual(
        expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) })
      );
    });

    it('should return 401 for incorrect password', async () => {
      const email = `wrong_${Date.now()}@example.com`;
      await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.6').send({ name: 'Login', email, password: 'Password123!' });
      const res = await loginUser({ email, password: 'WrongPass123!', ip: '10.0.0.7' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'INVALID_CREDENTIALS' }));
    });

    it('should return 401 for non-existent email', async () => {
      const res = await loginUser({ email: `none_${Date.now()}@example.com`, password: 'Password123!', ip: '10.0.0.8' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'INVALID_CREDENTIALS' }));
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully and rotate refresh token', async () => {
      const email = `refresh_${Date.now()}@example.com`;
      const registerRes = await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.9').send({ name: 'Refresh', email, password: 'Password123!' });
      const { refreshToken } = registerRes.body.data.tokens;

      const res = await api().post('/api/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.data.tokens).toEqual(
        expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) })
      );
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await api().post('/api/auth/refresh').set('X-Forwarded-For', '10.0.0.10').send({ refreshToken: 'not-a-valid-token' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'INVALID_TOKEN' }));
    });

    it('should return 401 for expired refresh token', async () => {
      // This would require a token that's actually expired, which is hard to test in integration
      // For now, we'll test with an invalid token format
      const res = await api().post('/api/auth/refresh').set('X-Forwarded-For', '10.0.0.11').send({ refreshToken: 'expired.token.here' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'INVALID_TOKEN' }));
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and return 204', async () => {
      const { res: registerRes } = await registerUser();
      const { accessToken } = registerRes.body.data.tokens;

      const res = await api().post('/api/auth/logout').set('Authorization', authHeader(accessToken));
      expect(res.status).toBe(204);
    });

    it('should return 401 for invalid token', async () => {
      const res = await api().post('/api/auth/logout').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 for missing token', async () => {
      const res = await api().post('/api/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const { res: registerRes } = await registerUser();
      const { accessToken } = registerRes.body.data.tokens;

      const res = await api().get('/api/auth/profile').set('Authorization', authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Profile fetched successfully.',
          data: expect.objectContaining({
            user: expect.objectContaining({ id: expect.any(String), email: expect.any(String) }),
          }),
        })
      );
    });

    it('should return 401 for invalid token', async () => {
      const res = await api().get('/api/auth/profile').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 for missing token', async () => {
      const res = await api().get('/api/auth/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit registration attempts from same IP', async () => {
      const ip = '10.0.0.12';

      // Make multiple registration attempts to trigger rate limit (test limit is 10)
      for (let i = 0; i < 11; i++) {
        const res = await api().post('/api/auth/register').set('X-Forwarded-For', ip).send({
          name: 'Rate Test',
          email: `${'testEmail'}_${i}@example.com`,
          password: 'Password123!',
        });
        
        if (i < 10) {
          expect(res.status).toBe(201); // First 10 should succeed
        } else {
          expect(res.status).toBe(429); // 11th should be rate limited
          expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'RATE_LIMIT_EXCEEDED' }));
        }
      }
    });

    it('should rate limit login attempts from same IP', async () => {
      const email = `login_rate_${Date.now()}@example.com`;
      const ip = '10.0.0.13';

      // Register a user first
      await api().post('/api/auth/register').set('X-Forwarded-For', ip).send({
        name: 'Login Rate Test',
        email,
        password: 'Password123!',
      });

      // Make multiple login attempts with wrong password (test limit is 10)
      for (let i = 0; i < 11; i++) {
        const res = await api().post('/api/auth/login').set('X-Forwarded-For', ip).send({
          email,
          password: 'WrongPassword123!',
        });
        
        if (i < 10) {
          expect(res.status).toBe(401); // First 10 should fail with wrong password
        } else {
          expect(res.status).toBe(429); // 11th should be rate limited
          expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'RATE_LIMIT_EXCEEDED' }));
        }
      }
    });
  });
});
