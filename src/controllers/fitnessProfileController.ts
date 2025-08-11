import catchAsync from "../utils/catchAsync";
import * as fitnessProfileService from "../services/fitnessProfileService";
import { Request, Response } from "express";

export const get = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const profile = await fitnessProfileService.get(userId);
  res.status(200).json({ success: true, message: "Fitness profile fetched successfully.", data: { fitnessProfile: profile } });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await fitnessProfileService.upsert(userId, req.body);
  res.status(200).json({ success: true, message: "Fitness profile updated successfully.", data: { fitnessProfile: result } });
});

export const onboarding = update;


