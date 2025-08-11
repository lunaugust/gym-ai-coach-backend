import prisma from "../config/database";
import ApiError from "../utils/ApiError";
import { computeBmiMetric } from "../utils/calculations";

export const list = async (userId: string, { from, to }: { from?: string; to?: string } = {}) => {
  const where: any = { userId };
  if (from || to) {
    where.recordedAt = {} as any;
    if (from) where.recordedAt.gte = new Date(from);
    if (to) where.recordedAt.lte = new Date(to);
  }
  const results = await prisma.userMeasurement.findMany({ where, orderBy: { recordedAt: "desc" } });
  return results;
};

export const create = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  const autoBmi = payload.bmi == null && payload.weight != null && payload.height != null
    ? computeBmiMetric(payload.weight, payload.height)
    : payload.bmi;
  const data = { userId, ...payload, bmi: autoBmi == null ? null : autoBmi } as any;
  const created = await prisma.userMeasurement.create({ data });
  return created;
};

export const update = async (userId: string, id: string, payload: any) => {
  const existing = await prisma.userMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, "Measurement not found", "MEASUREMENT_NOT_FOUND");
  }
  const autoBmi =
    payload.bmi == null && (payload.weight != null || payload.height != null)
      ? computeBmiMetric(payload.weight != null ? payload.weight : (existing as any).weight,
          payload.height != null ? payload.height : (existing as any).height)
      : payload.bmi;
  const updated = await prisma.userMeasurement.update({ where: { id }, data: { ...payload, bmi: autoBmi } });
  return updated;
};

export const remove = async (userId: string, id: string) => {
  const existing = await prisma.userMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, "Measurement not found", "MEASUREMENT_NOT_FOUND");
  }
  await prisma.userMeasurement.delete({ where: { id } });
};

export const progress = async (userId: string) => {
  const latest = await prisma.userMeasurement.findFirst({ where: { userId }, orderBy: { recordedAt: "desc" } });
  return latest || null;
};


