import * as authService from "../services/authService";
import catchAsync from "../utils/catchAsync";
import prisma from "../config/database";
import ApiError from "../utils/ApiError";
import { Request, Response } from "express";

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.register(req.body);
  res.status(201).json({ success: true, message: "Registration successful.", data: { user, tokens } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as any;
  const { user, tokens } = await authService.login(email, password);
  res.status(200).json({ success: true, message: "Login successful.", data: { user, tokens } });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as any;
  const { tokens } = await authService.refresh(refreshToken);
  res.status(200).json({ success: true, message: "Tokens refreshed successfully.", data: { tokens } });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.user!.userId);
  res.status(204).send();
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      weight: true,
      height: true,
      goal: true,
      experience_level: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  res.status(200).json({ success: true, message: "Profile fetched successfully.", data: { user } });
});

// CommonJS compatibility for tests that require() controllers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = { register, login, refresh, logout, getProfile } as any;


