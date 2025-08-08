const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
// Note: imageProcessor (sharp) is required lazily inside saveAvatar to avoid loading it unless used

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

/**
 * Save avatar to local storage (for simplicity). In production, swap for S3 or GCS.
 * @param {string} userId
 * @param {Buffer} fileBuffer
 * @returns {Promise<string>} public path/URL to avatar
 */
const saveAvatar = async (userId, fileBuffer) => {
  const { processAvatar } = require('../utils/imageProcessor');
  const processed = await processAvatar(fileBuffer);
  const hash = crypto.createHash('sha256').update(processed).digest('hex').slice(0, 16);
  const filename = `${userId}_${hash}.webp`;
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'avatars');
  await ensureDir(uploadDir);
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, processed);

  // Use app-relative URL path; adjust if serving static files from different base
  const publicPath = `/uploads/avatars/${filename}`;
  return publicPath;
};

/**
 * Update user's avatar field after saving file.
 * @param {string} userId
 * @param {Buffer} fileBuffer
 * @returns {Promise<{avatar: string}>}
 */
const uploadUserAvatar = async (userId, fileBuffer) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  const avatarUrl = await saveAvatar(userId, fileBuffer);
  await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
  return { avatar: avatarUrl };
};

module.exports = { uploadUserAvatar };


