const ApiError = require('../../../src/utils/ApiError');

// Mock Prisma client used by the service
jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userFitnessProfile: {
    findUnique: jest.fn(),
  },
  userPreferences: {
    findUnique: jest.fn(),
  },
  userMeasurement: {
    findFirst: jest.fn(),
  },
}));

const prisma = require('../../../src/config/database');
const userService = require('../../../src/services/userService');

describe('userService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchCompleteProfile', () => {
    it('returns combined profile data when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A' });
      prisma.userFitnessProfile.findUnique.mockResolvedValue({ userId: 'u1', activityLevel: 'sedentary' });
      prisma.userPreferences.findUnique.mockResolvedValue({ userId: 'u1', units: 'metric' });
      prisma.userMeasurement.findFirst.mockResolvedValue({ userId: 'u1', weight: 80 });

      const result = await userService.fetchCompleteProfile('u1');
      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'u1' }),
          fitnessProfile: expect.objectContaining({ userId: 'u1' }),
          preferences: expect.objectContaining({ userId: 'u1' }),
          recentMeasurement: expect.objectContaining({ userId: 'u1' }),
        })
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
    });

    it('throws ApiError(404) when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(userService.fetchCompleteProfile('nope')).rejects.toEqual(
        expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
      );
    });
  });

  describe('updateProfile', () => {
    it('updates only provided fields', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockResolvedValue({ id: 'u1', bio: 'Hello', age: 30 });

      const updated = await userService.updateProfile('u1', { bio: 'Hello', age: 30 });

      expect(updated).toEqual(expect.objectContaining({ id: 'u1', bio: 'Hello', age: 30 }));
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ bio: 'Hello', age: 30 }),
        })
      );
    });

    it('throws ApiError(404) when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(userService.updateProfile('x', { bio: 'a' })).rejects.toEqual(
        expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});


