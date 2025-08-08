const path = require('path');

// Ensure all projects run from repository root (two levels up from this config file)
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// This is the base configuration that will be shared across all test projects
const commonConfig = {
  rootDir: ROOT_DIR,
  clearMocks: true,
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  transform: {},
  //verbose: true,
  //bail: 1,
};

module.exports = {
  projects: [
    // Unit Test Project Configuration
    {
      ...commonConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['jest-extended/all'], // Only include what's needed for unit tests
    },
    // Integration Test Project Configuration
    {
      ...commonConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js', 'jest-extended/all'], // Include the database setup
    },
  ],
};