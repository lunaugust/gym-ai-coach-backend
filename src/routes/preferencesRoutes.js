const express = require('express');
const Joi = require('joi');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { preferencesSchema } = require('../validators/userValidators');
const preferencesController = require('../controllers/preferencesController');

const router = express.Router();

router.get('/', auth, preferencesController.get);
router.put('/', auth, validate(preferencesSchema), preferencesController.update);
router.put(
  '/notifications',
  auth,
  validate(Joi.object({
    workoutReminders: Joi.boolean(),
    progressUpdates: Joi.boolean(),
    motivationalTips: Joi.boolean(),
    emailNotifications: Joi.boolean(),
    pushNotifications: Joi.boolean(),
  })),
  preferencesController.updateNotifications
);
router.put(
  '/privacy',
  auth,
  validate(Joi.object({
    profileVisibility: Joi.string().valid('private', 'friends', 'public'),
    dataSharing: Joi.boolean(),
  })),
  preferencesController.updatePrivacy
);

module.exports = router;


