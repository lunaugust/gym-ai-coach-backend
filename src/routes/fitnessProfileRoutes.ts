import express from "express";
import auth from "../middleware/auth";
import validate from "../middleware/validate";
import { fitnessProfileSchema } from "../validators/userValidators";
import * as fitnessProfileController from "../controllers/fitnessProfileController";

const router = express.Router();

router.get("/", auth, fitnessProfileController.get);
router.put("/", auth, validate(fitnessProfileSchema), fitnessProfileController.update);
router.post("/onboarding", auth, validate(fitnessProfileSchema), fitnessProfileController.onboarding);

export default router;


