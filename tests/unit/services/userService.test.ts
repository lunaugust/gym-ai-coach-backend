import ApiError from '../../../src/utils/ApiError';
import * as userService from '../../../src/services/userService';
import prisma from '../../../src/config/database';

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

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('userService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchCompleteProfile', () => {
    it('returns combined profile data when user exists', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'A' } as any);
      mockedPrisma.userFitnessProfile.findUnique.mockResolvedValue({ userId: 'u1', activityLevel: 'sedentary' } as any);
      mockedPrisma.userPreferences.findUnique.mockResolvedValue({ userId: 'u1', units: 'metric' } as any);
      mockedPrisma.userMeasurement.findFirst.mockResolvedValue({ userId: 'u1', weight: 80 } as any);

      const result = await userService.fetchCompleteProfile('u1');
      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'u1' }),
          fitnessProfile: expect.objectContaining({ userId: 'u1' }),
          preferences: expect.objectContaining({ userId: 'u1' }),
          recentMeasurement: expect.objectContaining({ userId: 'u1' }),
        })
      );
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
    });

    it('throws ApiError(404) when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      await expect(userService.fetchCompleteProfile('nope')).rejects.toEqual(
        expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
      );
    });
  });

  describe('updateProfile', () => {
    it('updates only provided fields', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockedPrisma.user.update.mockResolvedValue({ id: 'u1', bio: 'Hello', age: 30 } as any);

      const updated = await userService.updateProfile('u1', { bio: 'Hello', age: 30 });

      expect(updated).toEqual(expect.objectContaining({ id: 'u1', bio: 'Hello', age: 30 }));
      expect(mockedPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: expect.objectContaining({ bio: 'Hello', age: 30 }),
        })
      );
    });

    it('throws ApiError(404) when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      await expect(userService.updateProfile('x', { bio: 'a' })).rejects.toEqual(
        expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
      );
      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
