import Joi, { Schema } from "joi";
import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

const validate = (schema: Schema) => (req: Request, _res: Response, next: NextFunction) => {
  const { value, error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return next(new ApiError(400, "Validation Failed", "VALIDATION_ERROR", errorDetails));
  }

  (req as any).body = value;
  return next();
};

export default validate;
// CommonJS compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = validate as any;


