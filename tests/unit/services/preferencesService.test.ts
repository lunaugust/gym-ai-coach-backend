import ApiError from '../../../src/utils/ApiError';
import * as preferencesService from '../../../src/services/preferencesService';
import prisma from '../../../src/config/database';

jest.mock('../../../src/config/database', () => ({
  user: { findUnique: jest.fn() },
  userPreferences: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('preferencesService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('get returns null when not present', async () => {
    mockedPrisma.userPreferences.findUnique.mockResolvedValue(null);
    const res = await preferencesService.get('u1');
    expect(res).toBeNull();
  });

  it('upsert validates user existence and writes fields', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
    mockedPrisma.userPreferences.upsert.mockResolvedValue({ userId: 'u1', units: 'metric' } as any);

    const payload = { units: 'metric', preferredWorkoutDays: ['monday'] };
    const out = await preferencesService.upsert('u1', payload);
    expect(out).toEqual(expect.objectContaining({ userId: 'u1', units: 'metric' }));
    expect(mockedPrisma.userPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, create: expect.any(Object), update: expect.any(Object) })
    );
  });

  it('upsert throws when user missing', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    await expect(preferencesService.upsert('bad', {})).rejects.toEqual(
      expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
    );
  });
});
