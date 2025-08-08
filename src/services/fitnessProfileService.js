const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

const get = async (userId) => {
  const profile = await prisma.userFitnessProfile.findUnique({ where: { userId } });
  return profile || null;
};

const upsert = async (userId, payload) => {
  // Ensure user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  const data = {
    ...(payload.currentWeight !== undefined && { currentWeight: payload.currentWeight }),
    ...(payload.targetWeight !== undefined && { targetWeight: payload.targetWeight }),
    ...(payload.bodyFatPercentage !== undefined && { bodyFatPercentage: payload.bodyFatPercentage }),
    ...(payload.muscleMass !== undefined && { muscleMass: payload.muscleMass }),
    ...(payload.activityLevel !== undefined && { activityLevel: payload.activityLevel }),
    ...(payload.workoutFrequency !== undefined && { workoutFrequency: payload.workoutFrequency }),
    ...(payload.previousExperience !== undefined && { previousExperience: payload.previousExperience }),
    ...(payload.injuries !== undefined && { injuries: payload.injuries }),
    ...(payload.medicalConditions !== undefined && { medicalConditions: payload.medicalConditions }),
    ...(payload.medications !== undefined && { medications: payload.medications }),
    ...(payload.primaryGoals !== undefined && { primaryGoals: payload.primaryGoals }),
    ...(payload.secondaryGoals !== undefined && { secondaryGoals: payload.secondaryGoals }),
    ...(payload.targetDate !== undefined && { targetDate: payload.targetDate }),
    ...(payload.motivations !== undefined && { motivations: payload.motivations }),
  };

  const result = await prisma.userFitnessProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return result;
};

module.exports = { get, upsert };


