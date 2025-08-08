const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { userProfileUpdateSchema } = require('../validators/userValidators');

const userController = require('../controllers/userController');
// Placeholder controllers to be implemented in later steps
// Note: fitness profile, preferences, and measurements routes are defined in their own files

const router = express.Router();

// User Profile Management
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validate(userProfileUpdateSchema), userController.updateProfile);
router.post('/profile/avatar', auth, upload.single('avatar'), userController.uploadAvatar);

// (Other user-related sub-resources mounted separately)

module.exports = router;


