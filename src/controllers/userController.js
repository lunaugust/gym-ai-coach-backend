const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const userService = require('../services/userService');
const { uploadUserAvatar } = require('../services/fileUploadService');

const getProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const data = await userService.fetchCompleteProfile(userId);
  res.status(200).json({ success: true, message: 'Profile fetched successfully.', data });
});

const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const updated = await userService.updateProfile(userId, req.body);
  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { user: updated } });
});

module.exports = { getProfile, updateProfile };
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw new ApiError(400, 'Avatar image is required.', 'VALIDATION_ERROR');
  }
  const userId = req.user.userId;
  const result = await uploadUserAvatar(userId, req.file.buffer);
  res.status(200).json({ success: true, message: 'Avatar updated successfully.', data: result });
});

module.exports = { getProfile, updateProfile, uploadAvatar };


