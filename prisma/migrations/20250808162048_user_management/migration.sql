-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active');

-- CreateEnum
CREATE TYPE "PreferredWorkoutTime" AS ENUM ('morning', 'afternoon', 'evening');

-- CreateEnum
CREATE TYPE "IntensityPreference" AS ENUM ('low', 'moderate', 'high', 'varied');

-- CreateEnum
CREATE TYPE "Units" AS ENUM ('metric', 'imperial');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('private', 'friends', 'public');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "user_fitness_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentWeight" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "activityLevel" "ActivityLevel",
    "workoutFrequency" INTEGER,
    "previousExperience" TEXT,
    "injuries" TEXT[],
    "medicalConditions" TEXT[],
    "medications" TEXT[],
    "primaryGoals" TEXT[],
    "secondaryGoals" TEXT[],
    "targetDate" TIMESTAMP(3),
    "motivations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_fitness_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredWorkoutDays" TEXT[],
    "preferredWorkoutTime" "PreferredWorkoutTime",
    "sessionDuration" INTEGER,
    "restBetweenSets" INTEGER,
    "availableEquipment" TEXT[],
    "gymAccess" BOOLEAN NOT NULL DEFAULT true,
    "homeGymSetup" BOOLEAN NOT NULL DEFAULT false,
    "preferredTrainingStyles" TEXT[],
    "intensityPreference" "IntensityPreference",
    "musicPreference" TEXT[],
    "dietaryRestrictions" TEXT[],
    "allergies" TEXT[],
    "workoutReminders" BOOLEAN NOT NULL DEFAULT true,
    "progressUpdates" BOOLEAN NOT NULL DEFAULT true,
    "motivationalTips" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'private',
    "dataSharing" BOOLEAN NOT NULL DEFAULT false,
    "units" "Units" NOT NULL DEFAULT 'metric',
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bodyFat" DOUBLE PRECISION,
    "muscleMass" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "biceps" DOUBLE PRECISION,
    "thighs" DOUBLE PRECISION,
    "neck" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "waterWeight" DOUBLE PRECISION,
    "boneMass" DOUBLE PRECISION,
    "frontPhoto" TEXT,
    "sidePhoto" TEXT,
    "backPhoto" TEXT,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_fitness_profiles_userId_key" ON "user_fitness_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_measurements_userId_recordedAt_idx" ON "user_measurements"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "user_fitness_profiles" ADD CONSTRAINT "user_fitness_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_measurements" ADD CONSTRAINT "user_measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
