const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res, next) => {
  const { user, tokens } = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: { user, tokens },
  });
});

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);
  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { user, tokens },
  });
});

/**
 * @desc    Refresh authentication tokens
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refresh = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const { tokens } = await authService.refresh(refreshToken);
  res.status(200).json({
    success: true,
    message: 'Tokens refreshed successfully.',
    data: { tokens },
  });
});

/**
 * @desc    Log out a user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res, next) => {
  // Note: req.user.userId will be attached by the 'auth' middleware
  await authService.logout(req.user.userId);
  res.status(204).send();
});

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = catchAsync(async (req, res, next) => {
  // Note: req.user.userId will be attached by the 'auth' middleware
  const userId = req.user.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Explicitly select fields to avoid sending the password hash
    select: {
      id: true, email: true, name: true, age: true, weight: true,
      height: true, goal: true, experience_level: true, createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully.',
    data: { user },
  });
});

module.exports = { register, login, refresh, logout, getProfile };