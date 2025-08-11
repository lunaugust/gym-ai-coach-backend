import { api } from '../helpers/apiHelpers';

describe('Integration: Users - Preferences', () => {
  const register = async () => {
    const email = `prefs_${Date.now()}@example.com`;
    const res = await api().post('/api/auth/register').send({ name: 'User', email, password: 'Password123!' });
    return { email, tokens: res.body.data.tokens };
  };

  it('PUT /api/users/preferences should upsert preferences', async () => {
    const { tokens } = await register();
    const payload = { preferredWorkoutDays: ['monday', 'wednesday'], units: 'metric' };
    const res = await api().put('/api/users/preferences').set('Authorization', `Bearer ${tokens.accessToken}`).send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data.preferences).toEqual(expect.objectContaining(payload));
  });
});
