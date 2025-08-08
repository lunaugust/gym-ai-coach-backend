const catchAsync = require('../utils/catchAsync');
const fitnessProfileService = require('../services/fitnessProfileService');

const get = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const profile = await fitnessProfileService.get(userId);
  res.status(200).json({ success: true, message: 'Fitness profile fetched successfully.', data: { fitnessProfile: profile } });
});

const update = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await fitnessProfileService.upsert(userId, req.body);
  res.status(200).json({ success: true, message: 'Fitness profile updated successfully.', data: { fitnessProfile: result } });
});

const onboarding = update;

module.exports = { get, update, onboarding };


