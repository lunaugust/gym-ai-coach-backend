import prisma from "../config/database";
import ApiError from "../utils/ApiError";

export const get = async (userId: string) => {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  return prefs || null;
};

export const upsert = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");

  const data: any = {
    ...(payload.preferredWorkoutDays !== undefined && { preferredWorkoutDays: payload.preferredWorkoutDays }),
    ...(payload.preferredWorkoutTime !== undefined && { preferredWorkoutTime: payload.preferredWorkoutTime }),
    ...(payload.sessionDuration !== undefined && { sessionDuration: payload.sessionDuration }),
    ...(payload.restBetweenSets !== undefined && { restBetweenSets: payload.restBetweenSets }),
    ...(payload.availableEquipment !== undefined && { availableEquipment: payload.availableEquipment }),
    ...(payload.gymAccess !== undefined && { gymAccess: payload.gymAccess }),
    ...(payload.homeGymSetup !== undefined && { homeGymSetup: payload.homeGymSetup }),
    ...(payload.preferredTrainingStyles !== undefined && { preferredTrainingStyles: payload.preferredTrainingStyles }),
    ...(payload.intensityPreference !== undefined && { intensityPreference: payload.intensityPreference }),
    ...(payload.musicPreference !== undefined && { musicPreference: payload.musicPreference }),
    ...(payload.dietaryRestrictions !== undefined && { dietaryRestrictions: payload.dietaryRestrictions }),
    ...(payload.allergies !== undefined && { allergies: payload.allergies }),
    ...(payload.workoutReminders !== undefined && { workoutReminders: payload.workoutReminders }),
    ...(payload.progressUpdates !== undefined && { progressUpdates: payload.progressUpdates }),
    ...(payload.motivationalTips !== undefined && { motivationalTips: payload.motivationalTips }),
    ...(payload.emailNotifications !== undefined && { emailNotifications: payload.emailNotifications }),
    ...(payload.pushNotifications !== undefined && { pushNotifications: payload.pushNotifications }),
    ...(payload.profileVisibility !== undefined && { profileVisibility: payload.profileVisibility }),
    ...(payload.dataSharing !== undefined && { dataSharing: payload.dataSharing }),
    ...(payload.units !== undefined && { units: payload.units }),
    ...(payload.language !== undefined && { language: payload.language }),
    ...(payload.theme !== undefined && { theme: payload.theme }),
  };

  const result = await prisma.userPreferences.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  return result;
};


