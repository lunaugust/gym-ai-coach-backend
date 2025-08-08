const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/config/database', () => ({
  user: { findUnique: jest.fn() },
  userMeasurement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
}));

const prisma = require('../../../src/config/database');
const measurementsService = require('../../../src/services/measurementsService');

describe('measurementsService', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('create', () => {
    it('auto-computes BMI when not provided (metric)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.userMeasurement.create.mockResolvedValue({ id: 'm1', userId: 'u1', bmi: 24.7 });

      const res = await measurementsService.create('u1', { 
        weight: 80, 
        height: 180 
      });

      expect(prisma.userMeasurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          weight: 80,
          height: 180,
          bmi: 24.7
        })
      });
      expect(res).toEqual(expect.objectContaining({ id: 'm1', bmi: 24.7 }));
    });

    it('uses provided BMI when given', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.userMeasurement.create.mockResolvedValue({ id: 'm1', bmi: 25.0 });

      const res = await measurementsService.create('u1', { 
        weight: 80, 
        height: 180,
        bmi: 25.0 
      });

      expect(prisma.userMeasurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bmi: 25.0
        })
      });
    });

    it('handles null BMI calculation gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.userMeasurement.create.mockResolvedValue({ id: 'm1', bmi: null });

      const res = await measurementsService.create('u1', { 
        weight: null, 
        height: 180 
      });

      expect(prisma.userMeasurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bmi: null
        })
      });
    });

    it('throws error when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(measurementsService.create('u1', { weight: 80 }))
        .rejects.toThrow(ApiError);
    });

    it('handles database errors gracefully', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.userMeasurement.create.mockRejectedValue(new Error('DB Error'));

      await expect(measurementsService.create('u1', { weight: 80 }))
        .rejects.toThrow('DB Error');
    });
  });

  describe('list', () => {
    it('returns all measurements for user', async () => {
      const mockMeasurements = [
        { id: 'm1', weight: 80, recordedAt: new Date() },
        { id: 'm2', weight: 79, recordedAt: new Date() }
      ];
      prisma.userMeasurement.findMany.mockResolvedValue(mockMeasurements);

      const res = await measurementsService.list('u1');

      expect(prisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { recordedAt: 'desc' }
      });
      expect(res).toEqual(mockMeasurements);
    });

    it('returns empty array when no measurements', async () => {
      prisma.userMeasurement.findMany.mockResolvedValue([]);

      const res = await measurementsService.list('u1');

      expect(res).toEqual([]);
    });

    it('handles database errors', async () => {
      prisma.userMeasurement.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(measurementsService.list('u1'))
        .rejects.toThrow('DB Error');
    });

    it('handles date range filtering', async () => {
      const mockMeasurements = [{ id: 'm1', weight: 80 }];
      prisma.userMeasurement.findMany.mockResolvedValue(mockMeasurements);

      const res = await measurementsService.list('u1', { from: '2024-01-01', to: '2024-01-31' });

      expect(prisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'u1',
          recordedAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        orderBy: { recordedAt: 'desc' }
      });
      expect(res).toEqual(mockMeasurements);
    });

    it('handles only from date', async () => {
      const mockMeasurements = [{ id: 'm1', weight: 80 }];
      prisma.userMeasurement.findMany.mockResolvedValue(mockMeasurements);

      const res = await measurementsService.list('u1', { from: '2024-01-01' });

      expect(prisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'u1',
          recordedAt: {
            gte: new Date('2024-01-01')
          }
        },
        orderBy: { recordedAt: 'desc' }
      });
    });

    it('handles only to date', async () => {
      const mockMeasurements = [{ id: 'm1', weight: 80 }];
      prisma.userMeasurement.findMany.mockResolvedValue(mockMeasurements);

      const res = await measurementsService.list('u1', { to: '2024-01-31' });

      expect(prisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'u1',
          recordedAt: {
            lte: new Date('2024-01-31')
          }
        },
        orderBy: { recordedAt: 'desc' }
      });
    });
  });

  describe('update', () => {
    it('updates measurement successfully', async () => {
      const mockMeasurement = { id: 'm1', weight: 81, userId: 'u1' };
      prisma.userMeasurement.findUnique.mockResolvedValue(mockMeasurement);
      prisma.userMeasurement.update.mockResolvedValue({ ...mockMeasurement, weight: 82 });

      const res = await measurementsService.update('u1', 'm1', { weight: 82 });

      expect(prisma.userMeasurement.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: expect.objectContaining({ weight: 82 })
      });
      expect(res.weight).toBe(82);
    });

    it('auto-computes BMI when weight/height updated', async () => {
      const mockMeasurement = { id: 'm1', weight: 80, height: 180, userId: 'u1' };
      prisma.userMeasurement.findUnique.mockResolvedValue(mockMeasurement);
      prisma.userMeasurement.update.mockResolvedValue({ ...mockMeasurement, weight: 81, bmi: 25.0 });

      await measurementsService.update('u1', 'm1', { weight: 81 });

      expect(prisma.userMeasurement.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: expect.objectContaining({ 
          weight: 81,
          bmi: 25.0
        })
      });
    });

    it('throws error when measurement not found', async () => {
      prisma.userMeasurement.findUnique.mockResolvedValue(null);

      await expect(measurementsService.update('u1', 'm1', { weight: 82 }))
        .rejects.toThrow(ApiError);
    });

    it('throws error when measurement belongs to different user', async () => {
      const mockMeasurement = { id: 'm1', userId: 'u2', weight: 80 };
      prisma.userMeasurement.findUnique.mockResolvedValue(mockMeasurement);

      await expect(measurementsService.update('u1', 'm1', { weight: 82 }))
        .rejects.toThrow(ApiError);
    });

    it('handles database errors', async () => {
      prisma.userMeasurement.findUnique.mockResolvedValue({ id: 'm1', userId: 'u1' });
      prisma.userMeasurement.update.mockRejectedValue(new Error('DB Error'));

      await expect(measurementsService.update('u1', 'm1', { weight: 82 }))
        .rejects.toThrow('DB Error');
    });
  });

  describe('remove', () => {
    it('deletes measurement successfully', async () => {
      const mockMeasurement = { id: 'm1', weight: 80, userId: 'u1' };
      prisma.userMeasurement.findUnique.mockResolvedValue(mockMeasurement);
      prisma.userMeasurement.delete.mockResolvedValue(mockMeasurement);

      await measurementsService.remove('u1', 'm1');

      expect(prisma.userMeasurement.delete).toHaveBeenCalledWith({
        where: { id: 'm1' }
      });
    });

    it('throws error when measurement not found', async () => {
      prisma.userMeasurement.findUnique.mockResolvedValue(null);

      await expect(measurementsService.remove('u1', 'm1'))
        .rejects.toThrow(ApiError);
    });

    it('throws error when measurement belongs to different user', async () => {
      const mockMeasurement = { id: 'm1', userId: 'u2', weight: 80 };
      prisma.userMeasurement.findUnique.mockResolvedValue(mockMeasurement);

      await expect(measurementsService.remove('u1', 'm1'))
        .rejects.toThrow(ApiError);
    });

    it('handles database errors', async () => {
      prisma.userMeasurement.findUnique.mockResolvedValue({ id: 'm1', userId: 'u1' });
      prisma.userMeasurement.delete.mockRejectedValue(new Error('DB Error'));

      await expect(measurementsService.remove('u1', 'm1'))
        .rejects.toThrow('DB Error');
    });
  });

  describe('progress', () => {
    it('returns latest measurement', async () => {
      const mockMeasurement = { id: 'm1', weight: 80, recordedAt: new Date() };
      prisma.userMeasurement.findFirst.mockResolvedValue(mockMeasurement);

      const res = await measurementsService.progress('u1');

      expect(prisma.userMeasurement.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { recordedAt: 'desc' }
      });
      expect(res).toEqual(mockMeasurement);
    });

    it('returns null when no measurements exist', async () => {
      prisma.userMeasurement.findFirst.mockResolvedValue(null);

      const res = await measurementsService.progress('u1');

      expect(res).toBeNull();
    });

    it('handles database errors', async () => {
      prisma.userMeasurement.findFirst.mockRejectedValue(new Error('DB Error'));

      await expect(measurementsService.progress('u1'))
        .rejects.toThrow('DB Error');
    });
  });
});


