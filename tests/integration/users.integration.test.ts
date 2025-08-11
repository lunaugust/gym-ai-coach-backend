import path from 'path';
import fs from 'fs';
import { api } from '../helpers/apiHelpers';

describe('Integration: Users - Profile & Avatar', () => {
  const register = async () => {
    const email = `user_${Date.now()}@example.com`;
    const res = await api().post('/api/auth/register').send({ name: 'User', email, password: 'Password123!' });
    return { email, tokens: res.body.data.tokens };
  };

  it('GET /api/users/profile should return profile for authenticated user', async () => {
    const { tokens } = await register();
    const res = await api().get('/api/users/profile').set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual(expect.objectContaining({ id: expect.any(String) }));
  });

  it('PUT /api/users/profile should update profile fields', async () => {
    const { tokens } = await register();
    const res = await api()
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({ bio: 'Hello there', age: 30 });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(expect.objectContaining({ bio: 'Hello there', age: 30 }));
  });

  it('POST /api/users/profile/avatar should accept image and update avatar url', async () => {
    const { tokens } = await register();
    const sample = path.join(__dirname, '..', 'postman', 'fixtures', 'avatar.png');
    // If fixture not present, skip gracefully
    if (!fs.existsSync(sample)) {
      console.warn('Skipping avatar upload test: fixture not found');
      return;
    }
    const res = await api()
      .post('/api/users/profile/avatar')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .attach('avatar', sample);
    expect(res.status).toBe(200);
    expect(res.body.data.avatar).toMatch(/^\/uploads\/avatars\/.+\.webp$/);
  });
});
