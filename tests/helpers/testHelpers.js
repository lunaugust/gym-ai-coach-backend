const { api, registerUser, loginUser, authHeader, generateIp } = require('./apiHelpers');

// ---- Assertion helpers ----

const expectSuccessResponse = (res, expectedStatus = 200) => {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toEqual(
    expect.objectContaining({ success: true, message: expect.any(String) })
  );
};

const expectErrorResponse = (res, expectedStatus, expectedErrorCode) => {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toEqual(
    expect.objectContaining({ success: false, error: expectedErrorCode })
  );
};

// ---- Data and auth helpers ----

const generateRandomEmail = (prefix = 'user') => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;

const registerAndGetTokens = async (overrides = {}) => {
  const { res, userData } = await registerUser(overrides);
  expectSuccessResponse(res, 201);
  const { user, tokens } = res.body.data;
  expect(user).toEqual(expect.objectContaining({ id: expect.any(String), email: userData.email }));
  expect(tokens).toEqual(expect.objectContaining({ accessToken: expect.any(String), refreshToken: expect.any(String) }));
  return { user, tokens, userData };
};

const createAuthenticatedUser = async (overrides = {}) => {
  const { user, tokens, userData } = await registerAndGetTokens(overrides);
  return { user, tokens, userData };
};

// ---- API convenience helpers ----

const getWithAuth = (url, token, ip = generateIp()) => {
  return api().get(url).set('Authorization', authHeader(token)).set('X-Forwarded-For', ip);
};

const postWithAuth = (url, token, body = {}, ip = generateIp()) => {
  return api().post(url).set('Authorization', authHeader(token)).set('X-Forwarded-For', ip).send(body);
};

module.exports = {
  // Assertions
  expectSuccessResponse,
  expectErrorResponse,
  // Data/auth
  generateRandomEmail,
  registerAndGetTokens,
  createAuthenticatedUser,
  // API
  getWithAuth,
  postWithAuth,
};


