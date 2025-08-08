const catchAsync = require('../utils/catchAsync');
const preferencesService = require('../services/preferencesService');

const get = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const prefs = await preferencesService.get(userId);
  res.status(200).json({ success: true, message: 'Preferences fetched successfully.', data: { preferences: prefs } });
});

const update = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const updated = await preferencesService.upsert(userId, req.body);
  res.status(200).json({ success: true, message: 'Preferences updated successfully.', data: { preferences: updated } });
});

const updateNotifications = update;
const updatePrivacy = update;

module.exports = { get, update, updateNotifications, updatePrivacy };


