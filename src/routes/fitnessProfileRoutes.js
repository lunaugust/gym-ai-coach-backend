const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { fitnessProfileSchema } = require('../validators/userValidators');
const fitnessProfileController = require('../controllers/fitnessProfileController');

const router = express.Router();

router.get('/', auth, fitnessProfileController.get);
router.put('/', auth, validate(fitnessProfileSchema), fitnessProfileController.update);
router.post('/onboarding', auth, validate(fitnessProfileSchema), fitnessProfileController.onboarding);

module.exports = router;


