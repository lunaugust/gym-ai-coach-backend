const { api, registerUser, loginUser, authHeader } = require('../helpers/apiHelpers');

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
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and return 204', async () => {
      const email = `logout_${Date.now()}@example.com`;
      const registerRes = await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.11').send({ name: 'Logout', email, password: 'Password123!' });
      const { accessToken } = registerRes.body.data.tokens;

      const res = await api().post('/api/auth/logout').set('Authorization', authHeader(accessToken));
      expect(res.status).toBe(204);
      expect(res.text).toBe('');
    });

    it('should return 401 when no token provided', async () => {
      const res = await api().post('/api/auth/logout').set('X-Forwarded-For', '10.0.0.12');
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'UNAUTHENTICATED' }));
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile with valid token', async () => {
      const email = `profile_${Date.now()}@example.com`;
      const registerRes = await api().post('/api/auth/register').set('X-Forwarded-For', '10.0.0.13').send({ name: 'Profile', email, password: 'Password123!' });
      const { accessToken } = registerRes.body.data.tokens;

      const res = await api().get('/api/auth/profile').set('Authorization', authHeader(accessToken));
      expect(res.status).toBe(200);
      expect(res.body.data.user).toEqual(
        expect.objectContaining({ id: expect.any(String), email })
      );
    });

    it('should return 401 without token', async () => {
      const res = await api().get('/api/auth/profile').set('X-Forwarded-For', '10.0.0.14');
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ success: false, error: 'UNAUTHENTICATED' }));
    });
  });
});


