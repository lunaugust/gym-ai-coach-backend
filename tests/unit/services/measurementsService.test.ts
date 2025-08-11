import ApiError from '../../../src/utils/ApiError';
import * as measurementsService from '../../../src/services/measurementsService';
import prisma from '../../../src/config/database';

// Mock the calculations utility
jest.mock('../../../src/utils/calculations', () => ({
  computeBmiMetric: jest.fn(),
}));

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

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
import { computeBmiMetric } from '../../../src/utils/calculations';
const mockedComputeBmiMetric = computeBmiMetric as jest.MockedFunction<typeof computeBmiMetric>;

describe('measurementsService', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('create', () => {
    it('auto-computes BMI when not provided (metric)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockedComputeBmiMetric.mockReturnValue(24.7);
      mockedPrisma.userMeasurement.create.mockResolvedValue({ id: 'm1', userId: 'u1', bmi: 24.7 } as any);

      const res = await measurementsService.create('u1', { 
        weight: 80, 
        height: 180 
      });

      expect(mockedComputeBmiMetric).toHaveBeenCalledWith(80, 180);
      expect(mockedPrisma.userMeasurement.create).toHaveBeenCalledWith({
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
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockedPrisma.userMeasurement.create.mockResolvedValue({ id: 'm1', bmi: 25.0 } as any);

      const res = await measurementsService.create('u1', { 
        weight: 80, 
        height: 180,
        bmi: 25.0 
      });

      expect(mockedPrisma.userMeasurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bmi: 25.0
        })
      });
    });

    it('handles null BMI calculation gracefully', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockedPrisma.userMeasurement.create.mockResolvedValue({ id: 'm1', bmi: null } as any);

      const res = await measurementsService.create('u1', { 
        weight: null, 
        height: 180 
      });

      expect(mockedPrisma.userMeasurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bmi: null
        })
      });
    });

    it('throws error when user not found', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(measurementsService.create('u1', { weight: 80 }))
        .rejects.toThrow(ApiError);
    });

    it('handles database errors gracefully', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({ id: 'u1' } as any);
      mockedPrisma.userMeasurement.create.mockRejectedValue(new Error('DB Error'));

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
      mockedPrisma.userMeasurement.findMany.mockResolvedValue(mockMeasurements as any);

      const res = await measurementsService.list('u1');

      expect(mockedPrisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { recordedAt: 'desc' }
      });
      expect(res).toEqual(mockMeasurements);
    });

    it('filters by date range when provided', async () => {
      const from = '2023-01-01';
      const to = '2023-12-31';
      mockedPrisma.userMeasurement.findMany.mockResolvedValue([]);

      await measurementsService.list('u1', { from, to });

      expect(mockedPrisma.userMeasurement.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'u1',
          recordedAt: {
            gte: new Date(from),
            lte: new Date(to)
          }
        },
        orderBy: { recordedAt: 'desc' }
      });
    });
  });

  describe('update', () => {
    it('updates measurement and auto-computes BMI', async () => {
      const existingMeasurement = { id: 'm1', userId: 'u1', weight: 80, height: 180 } as any;
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue(existingMeasurement);
      mockedComputeBmiMetric.mockReturnValue(24.7);
      mockedPrisma.userMeasurement.update.mockResolvedValue({ id: 'm1', bmi: 24.7 } as any);

      const res = await measurementsService.update('u1', 'm1', { weight: 79 });

      expect(mockedComputeBmiMetric).toHaveBeenCalledWith(79, 180);
      expect(mockedPrisma.userMeasurement.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: expect.objectContaining({ weight: 79, bmi: 24.7 })
      });
    });

    it('throws error when measurement not found', async () => {
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue(null);

      await expect(measurementsService.update('u1', 'm1', { weight: 79 }))
        .rejects.toThrow(ApiError);
    });

    it('throws error when measurement belongs to different user', async () => {
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue({ id: 'm1', userId: 'u2' } as any);

      await expect(measurementsService.update('u1', 'm1', { weight: 79 }))
        .rejects.toThrow(ApiError);
    });
  });

  describe('remove', () => {
    it('deletes measurement when found and owned by user', async () => {
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue({ id: 'm1', userId: 'u1' } as any);
      mockedPrisma.userMeasurement.delete.mockResolvedValue({ id: 'm1' } as any);

      await measurementsService.remove('u1', 'm1');

      expect(mockedPrisma.userMeasurement.delete).toHaveBeenCalledWith({
        where: { id: 'm1' }
      });
    });

    it('throws error when measurement not found', async () => {
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue(null);

      await expect(measurementsService.remove('u1', 'm1'))
        .rejects.toThrow(ApiError);
    });

    it('throws error when measurement belongs to different user', async () => {
      mockedPrisma.userMeasurement.findUnique.mockResolvedValue({ id: 'm1', userId: 'u2' } as any);

      await expect(measurementsService.remove('u1', 'm1'))
        .rejects.toThrow(ApiError);
    });
  });

  describe('progress', () => {
    it('returns latest measurement', async () => {
      const latestMeasurement = { id: 'm1', weight: 80, recordedAt: new Date() };
      mockedPrisma.userMeasurement.findFirst.mockResolvedValue(latestMeasurement as any);

      const res = await measurementsService.progress('u1');

      expect(mockedPrisma.userMeasurement.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { recordedAt: 'desc' }
      });
      expect(res).toEqual(latestMeasurement);
    });

    it('returns null when no measurements exist', async () => {
      mockedPrisma.userMeasurement.findFirst.mockResolvedValue(null);

      const res = await measurementsService.progress('u1');

      expect(res).toBeNull();
    });
  });
});
