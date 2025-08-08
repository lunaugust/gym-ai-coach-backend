const { api } = require('../helpers/apiHelpers');

describe('Integration: Users - Measurements', () => {
  const register = async () => {
    const email = `meas_${Date.now()}@example.com`;
    const res = await api().post('/api/auth/register').send({ name: 'User', email, password: 'Password123!' });
    return { email, tokens: res.body.data.tokens };
  };

  it('POST /api/users/measurements should create and auto-compute BMI', async () => {
    const { tokens } = await register();
    const payload = { weight: 80, height: 180 };
    const res = await api()
      .post('/api/users/measurements')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data.measurement).toEqual(expect.objectContaining({ bmi: expect.any(Number) }));
  });

  it('GET /api/users/measurements should list measurements', async () => {
    const { tokens } = await register();
    await api().post('/api/users/measurements').set('Authorization', `Bearer ${tokens.accessToken}`).send({ weight: 80, height: 180 });
    const res = await api().get('/api/users/measurements').set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.measurements).toBeArray();
  });
});


