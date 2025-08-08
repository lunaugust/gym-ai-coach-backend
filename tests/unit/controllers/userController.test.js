const ApiError = require('../../../src/utils/ApiError');

// Mock the userService
jest.mock('../../../src/services/userService', () => ({
  fetchCompleteProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const userService = require('../../../src/services/userService');
const userController = require('../../../src/controllers/userController');

describe('userController', () => {
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

  describe('getProfile', () => {
    it('should return complete user profile successfully', async () => {
      const mockProfile = {
        user: { id: 'user123', name: 'John Doe' },
        fitnessProfile: { currentWeight: 70 },
        preferences: { units: 'metric' },
        recentMeasurements: { weight: 70 }
      };

      userService.fetchCompleteProfile.mockResolvedValue(mockProfile);

      await userController.getProfile(mockReq, mockRes, mockNext);

      expect(userService.fetchCompleteProfile).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile fetched successfully.',
        data: mockProfile
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(404, 'User not found');
      userService.fetchCompleteProfile.mockRejectedValue(error);

      await userController.getProfile(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Database connection failed');
      userService.fetchCompleteProfile.mockRejectedValue(error);

      await userController.getProfile(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { name: 'Jane Doe', age: 30 };
      const mockUpdatedUser = { id: 'user123', ...updateData };

      userService.updateProfile.mockResolvedValue(mockUpdatedUser);
      mockReq.body = updateData;

      await userController.updateProfile(mockReq, mockRes, mockNext);

      expect(userService.updateProfile).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: mockUpdatedUser }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid name format');
      userService.updateProfile.mockRejectedValue(error);
      mockReq.body = { name: 'Invalid@Name' };

      await userController.updateProfile(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      userService.updateProfile.mockRejectedValue(error);
      mockReq.body = { name: 'Valid Name' };

      await userController.updateProfile(mockReq, mockRes, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle empty update data', async () => {
      mockReq.body = {};

      await userController.updateProfile(mockReq, mockRes, mockNext);

      expect(userService.updateProfile).toHaveBeenCalledWith('user123', {});
    });
  });
});
