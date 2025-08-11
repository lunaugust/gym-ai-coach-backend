import catchAsync from "../utils/catchAsync";
import * as measurementsService from "../services/measurementsService";
import { Request, Response } from "express";

export const list = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { from, to } = req.query as any;
  const items = await measurementsService.list(userId, { from, to });
  res.status(200).json({ success: true, message: "Measurements fetched successfully.", data: { measurements: items } });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const item = await measurementsService.create(userId, req.body);
  res.status(201).json({ success: true, message: "Measurement created successfully.", data: { measurement: item } });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as any;
  const item = await measurementsService.update(userId, id, req.body);
  res.status(200).json({ success: true, message: "Measurement updated successfully.", data: { measurement: item } });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params as any;
  await measurementsService.remove(userId, id);
  res.status(204).send();
});

export const progress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const latest = await measurementsService.progress(userId);
  res.status(200).json({ success: true, message: "Progress computed successfully.", data: { latest } });
});

// CommonJS compatibility for tests that require() controllers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(module as any).exports = { list, create, update, remove, progress } as any;


