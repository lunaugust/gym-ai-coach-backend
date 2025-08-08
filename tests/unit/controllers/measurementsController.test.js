const ApiError = require('../../../src/utils/ApiError');

// Mock the measurementsService
jest.mock('../../../src/services/measurementsService', () => ({
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  progress: jest.fn(),
}));

const measurementsService = require('../../../src/services/measurementsService');
const measurementsController = require('../../../src/controllers/measurementsController');

describe('measurementsController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

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

      measurementsService.create.mockResolvedValue(mockMeasurement);
      mockReq.body = measurementData;

      await measurementsController.create(mockReq, mockRes, mockNext);

      expect(measurementsService.create).toHaveBeenCalledWith('user123', measurementData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurement created successfully.',
        data: { measurement: mockMeasurement }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid weight value');
      measurementsService.create.mockRejectedValue(error);
      mockReq.body = { weight: -10 };

      await measurementsController.create(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      measurementsService.create.mockRejectedValue(error);
      mockReq.body = { weight: 70 };

      await measurementsController.create(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);

    });

    it('should handle empty measurement data', async () => {
      mockReq.body = {};

      await measurementsController.create(mockReq, mockRes, mockNext);

      expect(measurementsService.create).toHaveBeenCalledWith('user123', {});
    });
  });

  describe('list', () => {
    it('should return all measurements successfully', async () => {
      const mockMeasurements = [
        { id: 'meas1', weight: 70, recordedAt: new Date() },
        { id: 'meas2', weight: 71, recordedAt: new Date() }
      ];

      measurementsService.list.mockResolvedValue(mockMeasurements);

      await measurementsController.list(mockReq, mockRes, mockNext);

      expect(measurementsService.list).toHaveBeenCalledWith('user123', { from: undefined, to: undefined });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurements fetched successfully.',
        data: { measurements: mockMeasurements }
      });
    });

    it('should return empty array when no measurements', async () => {
      measurementsService.list.mockResolvedValue([]);

      await measurementsController.list(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurements fetched successfully.',
        data: { measurements: [] }
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      measurementsService.list.mockRejectedValue(error);

      await measurementsController.list(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error'
      }));
    });

    it('should handle date range queries', async () => {
      const mockMeasurements = [{ id: 'meas1', weight: 70 }];
      measurementsService.list.mockResolvedValue(mockMeasurements);
      mockReq.query = { from: '2024-01-01', to: '2024-01-31' };

      await measurementsController.list(mockReq, mockRes, mockNext);

      expect(measurementsService.list).toHaveBeenCalledWith('user123', { from: '2024-01-01', to: '2024-01-31' });
    });
  });

  describe('update', () => {
    it('should update measurement successfully', async () => {
      const updateData = { weight: 72 };
      const mockUpdatedMeasurement = { id: 'meas123', userId: 'user123', weight: 72 };

      measurementsService.update.mockResolvedValue(mockUpdatedMeasurement);
      mockReq.params = { id: 'meas123' };
      mockReq.body = updateData;

      await measurementsController.update(mockReq, mockRes, mockNext);

      expect(measurementsService.update).toHaveBeenCalledWith('user123', 'meas123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Measurement updated successfully.',
        data: { measurement: mockUpdatedMeasurement }
      });
    });

    it('should handle measurement not found', async () => {
      const error = new ApiError(404, 'Measurement not found');
      measurementsService.update.mockRejectedValue(error);
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { weight: 72 };

      await measurementsController.update(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Measurement not found'
      }));
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid weight value');
      measurementsService.update.mockRejectedValue(error);
      mockReq.params = { id: 'meas123' };
      mockReq.body = { weight: -10 };

      await measurementsController.update(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid weight value'
      }));
    });

    it('should handle empty update data', async () => {
      mockReq.params = { id: 'meas123' };
      mockReq.body = {};

      await measurementsController.update(mockReq, mockRes, mockNext);

      expect(measurementsService.update).toHaveBeenCalledWith('user123', 'meas123', {});
    });
  });

  describe('remove', () => {
    it('should delete measurement successfully', async () => {
      mockReq.params = { id: 'meas123' };

      await measurementsController.remove(mockReq, mockRes, mockNext);

      expect(measurementsService.remove).toHaveBeenCalledWith('user123', 'meas123');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledWith();
    });

    it('should handle measurement not found', async () => {
      const error = new ApiError(404, 'Measurement not found');
      measurementsService.remove.mockRejectedValue(error);
      mockReq.params = { id: 'nonexistent' };

      await measurementsController.remove(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Measurement not found'
      }));
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      measurementsService.remove.mockRejectedValue(error);
      mockReq.params = { id: 'meas123' };

      await measurementsController.remove(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error'
      }));
    });
  });

  describe('progress', () => {
    it('should return latest measurement successfully', async () => {
      const mockLatestMeasurement = { id: 'meas123', weight: 70, recordedAt: new Date() };

      measurementsService.progress.mockResolvedValue(mockLatestMeasurement);

      await measurementsController.progress(mockReq, mockRes, mockNext);

      expect(measurementsService.progress).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Progress computed successfully.',
        data: { latest: mockLatestMeasurement }
      });
    });

    it('should return null when no measurements exist', async () => {
      measurementsService.progress.mockResolvedValue(null);

      await measurementsController.progress(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Progress computed successfully.',
        data: { latest: null }
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      measurementsService.progress.mockRejectedValue(error);

      await measurementsController.progress(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error'
      }));
    });
  });
});
