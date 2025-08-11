import type { Request, Response, NextFunction } from 'express';
import ApiError from '../../../src/utils/ApiError';
import * as userService from '../../../src/services/userService';
import * as userController from '../../../src/controllers/userController';

// Mock the fileUploadService
jest.mock('../../../src/services/fileUploadService', () => ({
  uploadUserAvatar: jest.fn(),
}));

// Mock the userService
jest.mock('../../../src/services/userService', () => ({
  fetchCompleteProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

const mockedUserService = userService as jest.Mocked<typeof userService>;
import * as fileUploadService from '../../../src/services/fileUploadService';
const mockedFileUploadService = fileUploadService as jest.Mocked<typeof fileUploadService>;

describe('userController', () => {
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

  describe('getProfile', () => {
    it('should return complete user profile successfully', async () => {
      const mockProfile = {
        user: { id: 'user123', name: 'John Doe' },
        fitnessProfile: { currentWeight: 70 },
        preferences: { units: 'metric' },
        recentMeasurement: { weight: 70 }
      };

      mockedUserService.fetchCompleteProfile.mockResolvedValue(mockProfile);

      await userController.getProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.fetchCompleteProfile).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile fetched successfully.',
        data: mockProfile
      });
    });

    it('should handle service errors', async () => {
      const error = new ApiError(404, 'User not found');
      mockedUserService.fetchCompleteProfile.mockRejectedValue(error);

      await userController.getProfile(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle unexpected errors', async () => {
      const error = new Error('Database connection failed');
      mockedUserService.fetchCompleteProfile.mockRejectedValue(error);

      await userController.getProfile(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { name: 'Jane Doe', age: 30 };
      const mockUpdatedUser = { id: 'user123', ...updateData };

      mockedUserService.updateProfile.mockResolvedValue(mockUpdatedUser);
      mockReq.body = updateData;

      await userController.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.updateProfile).toHaveBeenCalledWith('user123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully.',
        data: { user: mockUpdatedUser }
      });
    });

    it('should handle validation errors', async () => {
      const error = new ApiError(400, 'Invalid name format');
      mockedUserService.updateProfile.mockRejectedValue(error);
      mockReq.body = { name: 'Invalid@Name' };

      await userController.updateProfile(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle service errors', async () => {
      const error = new ApiError(500, 'Database error');
      mockedUserService.updateProfile.mockRejectedValue(error);
      mockReq.body = { name: 'Valid Name' };

      await userController.updateProfile(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = { buffer: Buffer.from('test-image') };
      const mockResult = { avatar: '/uploads/avatars/test.jpg' };
      
      mockReq.file = mockFile as any;
      mockedFileUploadService.uploadUserAvatar.mockResolvedValue(mockResult);

      await userController.uploadAvatar(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedFileUploadService.uploadUserAvatar).toHaveBeenCalledWith('user123', mockFile.buffer);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Avatar updated successfully.',
        data: mockResult
      });
    });

    it('should handle missing file', async () => {
      mockReq.file = undefined;

      await userController.uploadAvatar(mockReq as Request, mockRes as Response, mockNext);
      await new Promise(process.nextTick);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});
