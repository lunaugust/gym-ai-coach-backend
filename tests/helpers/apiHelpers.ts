import request from 'supertest';
import type { SuperTest, Test } from 'supertest';
import type { Application } from 'express';

// Import the app directly - this works because the test setup ensures the app is properly initialized
import app from '../../src/app';

// Create a supertest instance with the Express app
const api = (): SuperTest<Test> => {
  return request(app);
};

const generateIp = (): string => `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

interface UserData {
  name: string;
  email: string;
  password: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  experience_level?: string;
}

interface RegisterOverrides {
  name?: string;
  email?: string;
  password?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  experience_level?: string;
  ip?: string;
}

const registerUser = async (overrides: RegisterOverrides = {}) => {
  const userData: UserData = {
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

interface LoginParams {
  email: string;
  password: string;
  ip?: string;
}

const loginUser = async ({ email, password, ip }: LoginParams) => {
  const clientIp = ip || generateIp();
  const res = await api().post('/api/auth/login').set('X-Forwarded-For', clientIp).send({ email, password });
  return res;
};

const authHeader = (accessToken: string): string => `Bearer ${accessToken}`;

export { api, registerUser, loginUser, authHeader, generateIp };
export type { UserData, RegisterOverrides, LoginParams };
