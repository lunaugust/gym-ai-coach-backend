const catchAsync = require('../utils/catchAsync');
const measurementsService = require('../services/measurementsService');

const list = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const { from, to } = req.query;
  const items = await measurementsService.list(userId, { from, to });
  res.status(200).json({ success: true, message: 'Measurements fetched successfully.', data: { measurements: items } });
});

const create = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const item = await measurementsService.create(userId, req.body);
  res.status(201).json({ success: true, message: 'Measurement created successfully.', data: { measurement: item } });
});

const update = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const item = await measurementsService.update(userId, id, req.body);
  res.status(200).json({ success: true, message: 'Measurement updated successfully.', data: { measurement: item } });
});

const remove = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const { id } = req.params;
  await measurementsService.remove(userId, id);
  res.status(204).send();
});

const progress = catchAsync(async (req, res, next) => {
  const userId = req.user.userId;
  const latest = await measurementsService.progress(userId);
  res.status(200).json({ success: true, message: 'Progress computed successfully.', data: { latest } });
});

module.exports = { list, create, update, remove, progress };


