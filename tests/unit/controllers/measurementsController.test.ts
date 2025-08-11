import type { Request, Response, NextFunction } from 'express';
import ApiError from '../../../src/utils/ApiError';
import * as measurementsService from '../../../src/services/measurementsService';
import * as measurementsController from '../../../src/controllers/measurementsController';

// Mock the measurementsService
jest.mock('../../../src/services/measurementsService', () => ({
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  progress: jest.fn(),
}));

const mockedMeasurementsService = measurementsService as jest.Mocked<typeof measurementsService>;

describe('measurementsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { userId: 'user123' },
      body: {},
      params: {},
      query: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('create', () => {
    it('should create measurement successfully', async () => {
      const measurementData = { weight: 70, height: 175 };
      const mockMeasurement = { id: 'meas123', userId: 'user123', ...measurementData };

      mockedMeasurementsService.create.mockResolvedValue(mockMeasurement);
      mockReq.body = measurementData;

      await measurementsController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.create).toHaveBeenCalledWith('user123', measurementData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurement created successfully.',
        data: { measurement: mockMeasurement }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid weight value');
      mockedMeasurementsService.create.mockRejectedValue(error);
      mockReq.body = { weight: -10 };

      await measurementsController.create(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedMeasurementsService.create.mockRejectedValue(error);
      mockReq.body = { weight: 70 };

      await measurementsController.create(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle empty measurement data', async () => {
      mockReq.body = {};

      await measurementsController.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.create).toHaveBeenCalledWith('user123', {});
    });
  });

  describe('list', () => {
    it('should return all measurements successfully', async () => {
      const mockMeasurements = [
        { id: 'meas1', weight: 70, recordedAt: new Date() },
        { id: 'meas2', weight: 71, recordedAt: new Date() }
      ];

      mockedMeasurementsService.list.mockResolvedValue(mockMeasurements);

      await measurementsController.list(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.list).toHaveBeenCalledWith('user123', { from: undefined, to: undefined });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurements fetched successfully.',
        data: { measurements: mockMeasurements }
      });
    });

    it('should handle date range filters', async () => {
      const mockMeasurements = [{ id: 'meas1', weight: 70 }];
      mockReq.query = { from: '2023-01-01', to: '2023-12-31' };

      mockedMeasurementsService.list.mockResolvedValue(mockMeasurements);

      await measurementsController.list(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.list).toHaveBeenCalledWith('user123', { from: '2023-01-01', to: '2023-12-31' });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedMeasurementsService.list.mockRejectedValue(error);

      await measurementsController.list(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update measurement successfully', async () => {
      const measurementId = 'meas123';
      const updateData = { weight: 72 };
      const mockUpdatedMeasurement = { id: measurementId, userId: 'user123', ...updateData };

      mockedMeasurementsService.update.mockResolvedValue(mockUpdatedMeasurement);
      mockReq.params = { id: measurementId };
      mockReq.body = updateData;

      await measurementsController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.update).toHaveBeenCalledWith('user123', measurementId, updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurement updated successfully.',
        data: { measurement: mockUpdatedMeasurement }
      });
    });

    it('should handle measurement not found', async () => {
      const error = new ApiError(404, 'Measurement not found');
      mockedMeasurementsService.update.mockRejectedValue(error);
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { weight: 72 };

      await measurementsController.update(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid weight value');
      mockedMeasurementsService.update.mockRejectedValue(error);
      mockReq.params = { id: 'meas123' };
      mockReq.body = { weight: -10 };

      await measurementsController.update(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('should delete measurement successfully', async () => {
      const measurementId = 'meas123';
      mockReq.params = { id: measurementId };

      mockedMeasurementsService.remove.mockResolvedValue(undefined);

      await measurementsController.remove(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.remove).toHaveBeenCalledWith('user123', measurementId);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledWith();
    });

    it('should handle measurement not found', async () => {
      const error = new ApiError(404, 'Measurement not found');
      mockedMeasurementsService.remove.mockRejectedValue(error);
      mockReq.params = { id: 'nonexistent' };

      await measurementsController.remove(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedMeasurementsService.remove.mockRejectedValue(error);
      mockReq.params = { id: 'meas123' };

      await measurementsController.remove(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('progress', () => {
    it('should return progress data successfully', async () => {
      const mockProgress = { id: 'meas123', weight: 70, recordedAt: new Date() };

      mockedMeasurementsService.progress.mockResolvedValue(mockProgress);

      await measurementsController.progress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedMeasurementsService.progress).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Progress computed successfully.',
        data: { latest: mockProgress }
      });
    });

    it('should handle no progress data', async () => {
      mockedMeasurementsService.progress.mockResolvedValue(null);

      await measurementsController.progress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Progress computed successfully.',
        data: { latest: null }
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedMeasurementsService.progress.mockRejectedValue(error);

      await measurementsController.progress(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
