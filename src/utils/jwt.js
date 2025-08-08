const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateJti = () => (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));

/**
 * Generates a JWT access token.
 * This token is short-lived and used to authenticate API requests.
 * @param {object} payload - The payload to include in the token ({ userId, email, name }).
 * @returns {string} The generated access token.
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION,
    jwtid: generateJti(),
  });
};

/**
 * Generates a JWT refresh token.
 * This token is long-lived and used to obtain a new access token.
 * @param {object} payload - The payload to include in the token ({ userId }).
 * @returns {string} The generated refresh token.
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    jwtid: generateJti(),
  });
};

/**
 * Generates both access and refresh tokens for a user.
 * @param {object} user - The user object (must contain id, email, name).
 * @returns {{accessToken: string, refreshToken: string}} An object containing the new tokens.
 */
const generateTokens = (user) => {
  const accessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  const refreshTokenPayload = {
    userId: user.id,
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);

  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
};