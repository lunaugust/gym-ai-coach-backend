const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/config/database', () => ({
  user: { findUnique: jest.fn() },
  userPreferences: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}));

const prisma = require('../../../src/config/database');
const preferencesService = require('../../../src/services/preferencesService');

describe('preferencesService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('get returns null when not present', async () => {
    prisma.userPreferences.findUnique.mockResolvedValue(null);
    const res = await preferencesService.get('u1');
    expect(res).toBeNull();
  });

  it('upsert validates user existence and writes fields', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.userPreferences.upsert.mockResolvedValue({ userId: 'u1', units: 'metric' });

    const payload = { units: 'metric', preferredWorkoutDays: ['monday'] };
    const out = await preferencesService.upsert('u1', payload);
    expect(out).toEqual(expect.objectContaining({ userId: 'u1', units: 'metric' }));
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, create: expect.any(Object), update: expect.any(Object) })
    );
  });

  it('upsert throws when user missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(preferencesService.upsert('bad', {})).rejects.toEqual(
      expect.objectContaining({ statusCode: 404, errorCode: 'USER_NOT_FOUND' })
    );
  });
});


