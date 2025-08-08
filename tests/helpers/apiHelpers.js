const request = require('supertest');
const app = require('../../src/app');

const api = () => request(app);

const generateIp = () => `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

const registerUser = async (overrides = {}) => {
  const userData = {
    name: overrides.name || 'Test User',
    email: overrides.email || `user_${Date.now()}@example.com`,
    password: overrides.password || 'Password123!',
    age: overrides.age ?? 25,
    weight: overrides.weight ?? 75.5,
    height: overrides.height ?? 178,
    goal: overrides.goal || 'muscle_gain',
    experience_level: overrides.experience_level || 'intermediate',
  };

  const ip = overrides.ip || generateIp();
  const res = await api().post('/api/auth/register').set('X-Forwarded-For', ip).send(userData);
  return { res, userData };
};

const loginUser = async ({ email, password, ip }) => {
  const clientIp = ip || generateIp();
  const res = await api().post('/api/auth/login').set('X-Forwarded-For', clientIp).send({ email, password });
  return res;
};

const authHeader = (accessToken) => `Bearer ${accessToken}`;

module.exports = { api, registerUser, loginUser, authHeader };


