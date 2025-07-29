const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * This function runs once before all test suites.
 * It ensures the test database is up-to-date with the schema.
 */
beforeAll(() => {
  execSync('npm run test:migrate');
});

/**
 * This function runs after each test case.
 * It cleans the database by deleting all data from the tables.
 */
afterEach(async () => {
  // The order of deletion is important due to foreign key constraints
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

/**
 * This function runs once after all test suites.
 * It disconnects the Prisma client.
 */
afterAll(async () => {
  await prisma.$disconnect();
});