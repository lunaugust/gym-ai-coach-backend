import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import prisma from "../config/database";
import ApiError from "../utils/ApiError";

const ensureDir = async (dirPath: string) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const saveAvatar = async (userId: string, fileBuffer: Buffer): Promise<string> => {
  const { processAvatar } = await import("../utils/imageProcessor");
  const processed = await processAvatar(fileBuffer);
  const hash = crypto.createHash("sha256").update(processed).digest("hex").slice(0, 16);
  const filename = `${userId}_${hash}.webp`;
  const uploadDir = path.resolve(process.cwd(), "uploads", "avatars");
  await ensureDir(uploadDir);
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, processed);

  const publicPath = `/uploads/avatars/${filename}`;
  return publicPath;
};

export const uploadUserAvatar = async (userId: string, fileBuffer: Buffer) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  const avatarUrl = await saveAvatar(userId, fileBuffer);
  await prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
  return { avatar: avatarUrl };
};


