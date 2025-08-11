import catchAsync from "../utils/catchAsync";
import * as preferencesService from "../services/preferencesService";
import { Request, Response } from "express";

export const get = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const prefs = await preferencesService.get(userId);
  res.status(200).json({ success: true, message: "Preferences fetched successfully.", data: { preferences: prefs } });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const updated = await preferencesService.upsert(userId, req.body);
  res.status(200).json({ success: true, message: "Preferences updated successfully.", data: { preferences: updated } });
});

export const updateNotifications = update;
export const updatePrivacy = update;

// CommonJS compatibility for tests that require() controllers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = { get, update, updateNotifications, updatePrivacy } as any;


