const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { measurementCreateSchema, measurementUpdateSchema } = require('../validators/userValidators');
const measurementsController = require('../controllers/measurementsController');

const router = express.Router();

router.get('/', auth, measurementsController.list);
router.post('/', auth, validate(measurementCreateSchema), measurementsController.create);
router.put('/:id', auth, validate(measurementUpdateSchema), measurementsController.update);
router.delete('/:id', auth, measurementsController.remove);
router.get('/progress', auth, measurementsController.progress);

module.exports = router;


