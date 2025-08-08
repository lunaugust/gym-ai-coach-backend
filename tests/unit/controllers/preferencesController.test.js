const ApiError = require('../../../src/utils/ApiError');

// Mock the preferencesService
jest.mock('../../../src/services/preferencesService', () => ({
  get: jest.fn(),
  upsert: jest.fn(),
}));

const preferencesService = require('../../../src/services/preferencesService');
const preferencesController = require('../../../src/controllers/preferencesController');

describe('preferencesController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: { userId: 'user123' },
      body: {},
      params: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('get', () => {
    it('should return user preferences successfully', async () => {
      const mockPreferences = {
        preferredWorkoutDays: ['monday', 'wednesday'],
        units: 'metric',
        workoutReminders: true
      };

      preferencesService.get.mockResolvedValue(mockPreferences);

      await preferencesController.get(mockReq, mockRes, mockNext);

      expect(preferencesService.get).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences fetched successfully.',
        data: { preferences: mockPreferences }
      });
    });

    it('should return null when no preferences exist', async () => {
      preferencesService.get.mockResolvedValue(null);

      await preferencesController.get(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences fetched successfully.',
        data: { preferences: null }
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      preferencesService.get.mockRejectedValue(error);

      await preferencesController.get(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Connection failed');
      preferencesService.get.mockRejectedValue(error);

      await preferencesController.get(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update user preferences successfully', async () => {
      const updateData = {
        preferredWorkoutDays: ['tuesday', 'thursday'],
        units: 'imperial'
      };
      const mockUpdatedPreferences = { id: 'pref123', userId: 'user123', ...updateData };

      preferencesService.upsert.mockResolvedValue(mockUpdatedPreferences);
      mockReq.body = updateData;

      await preferencesController.update(mockReq, mockRes, mockNext);

      expect(preferencesService.upsert).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully.',
        data: { preferences: mockUpdatedPreferences }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid workout days');
      preferencesService.upsert.mockRejectedValue(error);
      mockReq.body = { preferredWorkoutDays: ['invalid-day'] };

      await preferencesController.update(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      preferencesService.upsert.mockRejectedValue(error);
      mockReq.body = { units: 'metric' };
      await new Promise(process.nextTick);
      await preferencesController.update(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Database error');
    });

    it('should handle empty update data', async () => {
      mockReq.body = {};

      await preferencesController.update(mockReq, mockRes, mockNext);

      expect(preferencesService.upsert).toHaveBeenCalledWith('user123', {});
    });

    it('should handle partial updates', async () => {
      const partialData = { units: 'metric' };
      const mockUpdatedPreferences = { id: 'pref123', userId: 'user123', units: 'metric' };

      preferencesService.upsert.mockResolvedValue(mockUpdatedPreferences);
      mockReq.body = partialData;

      await preferencesController.update(mockReq, mockRes, mockNext);

      expect(preferencesService.upsert).toHaveBeenCalledWith('user123', partialData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully.',
        data: { preferences: mockUpdatedPreferences }
      });
    });
  });
});
