import multer, { FileFilterCallback } from "multer";
import ApiError from "../utils/ApiError";

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, or WEBP images are allowed.", "INVALID_FILE_TYPE") as any);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
});

export default upload;


