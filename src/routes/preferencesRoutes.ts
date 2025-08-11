import express from "express";
import Joi from "joi";
import auth from "../middleware/auth";
import validate from "../middleware/validate";
import { preferencesSchema } from "../validators/userValidators";
import * as preferencesController from "../controllers/preferencesController";

const router = express.Router();

router.get("/", auth, preferencesController.get);
router.put("/", auth, validate(preferencesSchema), preferencesController.update);
router.put(
  "/notifications",
  auth,
  validate(
    Joi.object({
      workoutReminders: Joi.boolean(),
      progressUpdates: Joi.boolean(),
      motivationalTips: Joi.boolean(),
      emailNotifications: Joi.boolean(),
      pushNotifications: Joi.boolean(),
    })
  ),
  preferencesController.updateNotifications
);
router.put(
  "/privacy",
  auth,
  validate(
    Joi.object({
      profileVisibility: Joi.string().valid("private", "friends", "public"),
      dataSharing: Joi.boolean(),
    })
  ),
  preferencesController.updatePrivacy
);

export default router;


