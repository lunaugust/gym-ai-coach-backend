const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

// --- Rate Limiting Middleware ---

// Stricter rate limit for registration to prevent spam
const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 registration attempts per IP per minute
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again after a minute.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard rate limit for login to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 login attempts per IP per minute
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after a minute.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Public Routes ---
router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);

// --- Private Routes (require authentication) ---
router.post('/logout', auth, authController.logout);
router.get('/profile', auth, authController.getProfile);

module.exports = router;