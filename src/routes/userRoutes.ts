import express from "express";
import auth from "../middleware/auth";
import validate from "../middleware/validate";
import upload from "../middleware/upload";
import { userProfileUpdateSchema } from "../validators/userValidators";
import * as userController from "../controllers/userController";

const router = express.Router();

router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, validate(userProfileUpdateSchema), userController.updateProfile);
router.post("/profile/avatar", auth, (upload as any).single("avatar"), userController.uploadAvatar);

export default router;


