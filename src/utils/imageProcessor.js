const sharp = require('sharp');

/**
 * Process an avatar image buffer: resize, convert, and compress.
 * Returns a WebP buffer sized to 256x256, preserving aspect ratio with cover.
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
const processAvatar = async (inputBuffer) => {
  const buffer = await sharp(inputBuffer)
    .rotate()
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  return buffer;
};

module.exports = { processAvatar };


