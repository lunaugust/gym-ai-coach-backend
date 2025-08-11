import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController";
import { registerSchema, loginSchema, refreshSchema } from "../validators/authValidator";
import validate from "../middleware/validate";
import auth from "../middleware/auth";

const router = express.Router();

const isTestEnv = process.env.NODE_ENV === "test";
const noop = (_req: any, _res: any, next: any) => next();
const registerLimiter = isTestEnv
  ? (noop as any)
  : rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      message: {
        success: false,
        message: "Too many registration attempts from this IP, please try again after a minute.",
        error: "RATE_LIMIT_EXCEEDED",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

const loginLimiter = isTestEnv
  ? (noop as any)
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      message: {
        success: false,
        message: "Too many login attempts from this IP, please try again after a minute.",
        error: "RATE_LIMIT_EXCEEDED",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

router.post("/register", registerLimiter as any, validate(registerSchema), authController.register);
router.post("/login", loginLimiter as any, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);

router.post("/logout", auth, authController.logout);
router.get("/profile", auth, authController.getProfile);

export default router;


