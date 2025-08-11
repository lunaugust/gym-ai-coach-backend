import express from "express";
import auth from "../middleware/auth";
import validate from "../middleware/validate";
import { measurementCreateSchema, measurementUpdateSchema } from "../validators/userValidators";
import * as measurementsController from "../controllers/measurementsController";

const router = express.Router();

router.get("/", auth, measurementsController.list);
router.post("/", auth, validate(measurementCreateSchema), measurementsController.create);
router.put("/:id", auth, validate(measurementUpdateSchema), measurementsController.update);
router.delete("/:id", auth, measurementsController.remove);
router.get("/progress", auth, measurementsController.progress);

export default router;


