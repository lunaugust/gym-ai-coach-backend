import sharp from "sharp";

export const processAvatar = async (inputBuffer: Buffer): Promise<Buffer> => {
  const buffer = await sharp(inputBuffer)
    .rotate()
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();
  return buffer;
};


