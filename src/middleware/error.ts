import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";

const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let error = err as any;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, "INTERNAL_SERVER_ERROR");
  }

  logger.error(error);

  const response: any = {
    success: false,
    message: error.message,
    error: error.errorCode,
    ...(error.details.length && { details: error.details }),
  };

  if (process.env.NODE_ENV === "production" && error.statusCode === 500) {
    response.message = "An unexpected error occurred on the server.";
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;


