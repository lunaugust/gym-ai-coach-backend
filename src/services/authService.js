const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const { generateTokens } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

/**
 * Registers a new user.
 * @param {object} userData - The user data from the request body.
 * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
 */
const register = async (userData) => {
  const { email, password, name, age, weight, height, goal, experience_level } = userData;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_CONFLICT');
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create the user in the database
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      age,
      weight,
      height,
      goal,
      experience_level,
    },
  });
  // Ensure the user record exists in DB before writing dependent records
  // This extra read ensures some eventual consistency issues in certain test DBs
  await prisma.user.findUnique({ where: { id: user.id } });

  // 4. Generate tokens
  const tokens = generateTokens(user);

  // 5. Store the refresh token in the database
  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION));
  try {
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });
  } catch (e) {
    // In rare cases of token collision due to unique constraint, re-issue tokens once
    const retryTokens = generateTokens(user);
    await prisma.refreshToken.create({
      data: {
        token: retryTokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });
    return { user: (({ password, ...rest }) => rest)(user), tokens: retryTokens };
  }

  // 6. Return user and tokens (exclude password from user object)
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{user: object, tokens: {accessToken: string, refreshToken: string}}>}
 */
const login = async (email, password) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // 2. Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // 3. Generate and store new tokens (same logic as register)
  const tokens = generateTokens(user);
  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION));
  try {
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });
  } catch (e) {
    // Token collision retry
    const retryTokens = generateTokens(user);
    await prisma.refreshToken.create({
      data: {
        token: retryTokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });
    const { password: __, ...userWithoutPassword2 } = user;
    return { user: userWithoutPassword2, tokens: retryTokens };
  }

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, tokens };
};

/**
 * Refreshes JWT tokens.
 * @param {string} oldRefreshToken - The expired refresh token from the user.
 * @returns {Promise<{tokens: {accessToken: string, refreshToken: string}}>}
 */
const refresh = async (oldRefreshToken) => {
  // 1. Verify the refresh token
  let payload;
  try {
    payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN');
  }

  // 2. Check if the token exists in the database (it hasn't been revoked)
  const tokenInDb = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  });
  if (!tokenInDb) {
    throw new ApiError(401, 'Invalid refresh token.', 'INVALID_TOKEN');
  }

  // 3. (Important) Delete the used refresh token (token rotation)
  await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });

  // 4. Find the user associated with the token
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new ApiError(401, 'User not found.', 'USER_NOT_FOUND');
  }

  // 5. Generate and store new tokens
  const tokens = generateTokens(user);
  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION));
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return { tokens };
};

/**
 * Logs out a user by deleting all their refresh tokens.
 * @param {string} userId - The ID of the user to log out.
 * @returns {Promise<void>}
 */
const logout = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};