import catchAsync from "../utils/catchAsync";
import ApiError from "../utils/ApiError";
import * as userService from "../services/userService";
import { uploadUserAvatar } from "../services/fileUploadService";
import { Request, Response } from "express";

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const data = await userService.fetchCompleteProfile(userId);
  res.status(200).json({ success: true, message: "Profile fetched successfully.", data });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const updated = await userService.updateProfile(userId, req.body);
  res.status(200).json({ success: true, message: "Profile updated successfully.", data: { user: updated } });
});

export const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, "Avatar image is required.", "VALIDATION_ERROR");
  }
  const userId = req.user!.userId;
  const result = await uploadUserAvatar(userId, req.file.buffer);
  res.status(200).json({ success: true, message: "Avatar updated successfully.", data: result });
});


