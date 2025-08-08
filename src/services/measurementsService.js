const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { computeBmiMetric } = require('../utils/calculations');

const list = async (userId, { from, to } = {}) => {
  const where = { userId };
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to) where.recordedAt.lte = new Date(to);
  }
  const results = await prisma.userMeasurement.findMany({ where, orderBy: { recordedAt: 'desc' } });
  return results;
};

const create = async (userId, payload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  const autoBmi =
    payload.bmi == null && payload.weight != null && payload.height != null
      ? computeBmiMetric(payload.weight, payload.height)
      : payload.bmi;
  const data = { userId, ...payload, bmi: autoBmi == null ? null : autoBmi };
  const created = await prisma.userMeasurement.create({ data });
  return created;
};

const update = async (userId, id, payload) => {
  const existing = await prisma.userMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, 'Measurement not found', 'MEASUREMENT_NOT_FOUND');
  }
  const autoBmi =
    payload.bmi == null && (payload.weight != null || payload.height != null)
      ? computeBmiMetric(
          payload.weight != null ? payload.weight : existing.weight,
          payload.height != null ? payload.height : existing.height
        )
      : payload.bmi;
  const updated = await prisma.userMeasurement.update({ where: { id }, data: { ...payload, bmi: autoBmi } });
  return updated;
};

const remove = async (userId, id) => {
  const existing = await prisma.userMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new ApiError(404, 'Measurement not found', 'MEASUREMENT_NOT_FOUND');
  }
  await prisma.userMeasurement.delete({ where: { id } });
};

// Simple progress metrics; extend later for analytics
const progress = async (userId) => {
  const latest = await prisma.userMeasurement.findFirst({ where: { userId }, orderBy: { recordedAt: 'desc' } });
  return latest || null;
};

module.exports = { list, create, update, remove, progress };


