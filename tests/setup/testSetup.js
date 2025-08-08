const { execSync } = require('child_process');
const path = require('path');

// Ensure test env vars (.env.test) are loaded for the running Node process BEFORE anything else
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
let prisma; // Will be initialized after migrations/generate

/**
 * This function runs once before all test suites.
 * It ensures the test database is up-to-date with the schema.
 */
beforeAll(() => {
  // Keep idempotent and fast: only run migrations; avoid prisma generate during tests (causes file locks on Windows)
  execSync('npm run test:migrate', { stdio: 'inherit' });
  // Lazy require after migrations to ensure client connects with latest schema
  // eslint-disable-next-line global-require
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
});

/**
 * This function runs after each test case.
 * It cleans the database by deleting all data from the tables.
 */
afterEach(async () => {
  // The order of deletion is important due to foreign key constraints
  await prisma.refreshToken.deleteMany();
  await prisma.userMeasurement.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.userFitnessProfile.deleteMany();
  await prisma.user.deleteMany();
});

/**
 * This function runs once after all test suites.
 * It disconnects the Prisma client.
 */
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});