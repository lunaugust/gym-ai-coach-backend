import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController";
import { registerSchema, loginSchema, refreshSchema } from "../validators/authValidator";
import validate from "../middleware/validate";
import auth from "../middleware/auth";

const router = express.Router();

const isTestEnv = process.env.NODE_ENV === "test";
const noop = (_req: any, _res: any, next: any) => next();

// Rate limiting configuration - higher limits for test environment
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestEnv ? 10 : 3, // Higher limit for tests
  message: {
    success: false,
    message: "Too many registration attempts from this IP, please try again after a minute.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestEnv ? 10 : 5, // Higher limit for tests
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after a minute.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
});

router.post("/register", registerLimiter as any, validate(registerSchema), authController.register);
router.post("/login", loginLimiter as any, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);

router.post("/logout", auth, authController.logout);
router.get("/profile", auth, authController.getProfile);

export default router;


