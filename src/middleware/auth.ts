import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

const auth = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ApiError(401, "Authentication token is required.", "UNAUTHENTICATED"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & {
      userId: string;
      email?: string;
      name?: string;
    };
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      return next(new ApiError(401, "Your session has expired. Please log in again.", "TOKEN_EXPIRED"));
    }
    return next(new ApiError(401, "Invalid token. Please log in again.", "INVALID_TOKEN"));
  }
});

export default auth;

// CommonJS compatibility for jest require mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = auth as any;


