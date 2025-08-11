import type { Request, Response, NextFunction } from 'express';
import ApiError from '../../../src/utils/ApiError';
import * as preferencesService from '../../../src/services/preferencesService';
import * as preferencesController from '../../../src/controllers/preferencesController';

// Mock the preferencesService
jest.mock('../../../src/services/preferencesService', () => ({
  get: jest.fn(),
  upsert: jest.fn(),
}));

const mockedPreferencesService = preferencesService as jest.Mocked<typeof preferencesService>;

describe('preferencesController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

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

      mockedPreferencesService.get.mockResolvedValue(mockPreferences);

      await preferencesController.get(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedPreferencesService.get).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences fetched successfully.',
        data: { preferences: mockPreferences }
      });
    });

    it('should return null when no preferences exist', async () => {
      mockedPreferencesService.get.mockResolvedValue(null);

      await preferencesController.get(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences fetched successfully.',
        data: { preferences: null }
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedPreferencesService.get.mockRejectedValue(error);

      await preferencesController.get(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Connection failed');
      mockedPreferencesService.get.mockRejectedValue(error);

      await preferencesController.get(mockReq as Request, mockRes as Response, mockNext);
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

      mockedPreferencesService.upsert.mockResolvedValue(mockUpdatedPreferences);
      mockReq.body = updateData;

      await preferencesController.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedPreferencesService.upsert).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully.',
        data: { preferences: mockUpdatedPreferences }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid workout days');
      mockedPreferencesService.upsert.mockRejectedValue(error);
      mockReq.body = { preferredWorkoutDays: ['invalid-day'] };

      await preferencesController.update(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedPreferencesService.upsert.mockRejectedValue(error);
      mockReq.body = { units: 'metric' };
      await new Promise(process.nextTick);

      await preferencesController.update(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateNotifications', () => {
    it('should update notification preferences successfully', async () => {
      const updateData = {
        workoutReminders: false,
        emailNotifications: true
      };
      const mockUpdatedPreferences = { id: 'pref123', userId: 'user123', ...updateData };

      mockedPreferencesService.upsert.mockResolvedValue(mockUpdatedPreferences);
      mockReq.body = updateData;

      await preferencesController.updateNotifications(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedPreferencesService.upsert).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully.',
        data: { preferences: mockUpdatedPreferences }
      });
    });
  });

  describe('updatePrivacy', () => {
    it('should update privacy preferences successfully', async () => {
      const updateData = {
        profileVisibility: 'public',
        dataSharing: true
      };
      const mockUpdatedPreferences = { id: 'pref123', userId: 'user123', ...updateData };

      mockedPreferencesService.upsert.mockResolvedValue(mockUpdatedPreferences);
      mockReq.body = updateData;

      await preferencesController.updatePrivacy(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedPreferencesService.upsert).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Preferences updated successfully.',
        data: { preferences: mockUpdatedPreferences }
      });
    });
  });
});
