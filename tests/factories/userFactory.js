const { faker } = require('@faker-js/faker');

/**
 * Generates a complete, valid user data object for testing.
 * @param {object} overrides - Optional fields to override the defaults.
 * @returns {object} A user data object.
 */
const createValidUserData = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: 'Password123!',
  age: faker.number.int({ min: 18, max: 65 }),
  weight: faker.number.float({ min: 50, max: 120, multipleOf: 0.5 }),
  height: faker.number.int({ min: 150, max: 200 }),
  goal: 'muscle_gain',
  experience_level: 'intermediate',
  ...overrides,
});

/**
 * Generates a user data object with only the required fields.
 * @param {object} overrides - Optional fields to override the defaults.
 * @returns {object} A user data object with minimal required fields.
 */
const createMinimalUserData = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: 'Password123!',
  ...overrides,
});

module.exports = {
  createValidUserData,
  createMinimalUserData,
};