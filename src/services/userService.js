const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Fetch a complete profile for a user including fitness profile, preferences,
 * and most recent measurement record.
 * @param {string} userId
 * @returns {Promise<{user: object, fitnessProfile: object|null, preferences: object|null, recentMeasurement: object|null}>}
 */
const fetchCompleteProfile = async (userId) => {
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
      isActive: true,
      avatar: true,
      bio: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
      location: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  const [fitnessProfile, preferences, recentMeasurement] = await Promise.all([
    prisma.userFitnessProfile.findUnique({ where: { userId } }),
    prisma.userPreferences.findUnique({ where: { userId } }),
    prisma.userMeasurement.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    }),
  ]);

  return { user, fitnessProfile, preferences, recentMeasurement };
};

/**
 * Update core user profile fields. Only fields provided will be updated.
 * @param {string} userId
 * @param {object} updatePayload
 * @returns {Promise<object>} Updated user record
 */
const updateProfile = async (userId, updatePayload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  const {
    name,
    age,
    weight,
    height,
    bio,
    avatar,
    gender,
    dateOfBirth,
    phone,
    location,
    timezone,
  } = updatePayload;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(age !== undefined && { age }),
      ...(weight !== undefined && { weight }),
      ...(height !== undefined && { height }),
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
      ...(gender !== undefined && { gender }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(phone !== undefined && { phone }),
      ...(location !== undefined && { location }),
      ...(timezone !== undefined && { timezone }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      weight: true,
      height: true,
      goal: true,
      experience_level: true,
      isActive: true,
      avatar: true,
      bio: true,
      gender: true,
      dateOfBirth: true,
      phone: true,
      location: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};

module.exports = {
  fetchCompleteProfile,
  updateProfile,
};


