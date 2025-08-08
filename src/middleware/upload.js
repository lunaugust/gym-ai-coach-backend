const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Use memory storage so we can run image processing before persisting
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only JPEG, PNG, or WEBP images are allowed.', 'INVALID_FILE_TYPE'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});

module.exports = upload;


