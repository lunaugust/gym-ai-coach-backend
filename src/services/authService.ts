import prisma from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ms from "ms";
import { generateTokens } from "../utils/jwt";
import ApiError from "../utils/ApiError";

const SALT_ROUNDS = 12;

export const register = async (userData: any) => {
  const { email, password, name, age, weight, height, goal, experience_level } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.", "EMAIL_CONFLICT");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, age, weight, height, goal, experience_level },
  });
  await prisma.user.findUnique({ where: { id: user.id } });

  const tokens = generateTokens(user as any);

  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION as string));
  try {
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt } });
  } catch (_e) {
    const retryTokens = generateTokens(user as any);
    await prisma.refreshToken.create({ data: { token: retryTokens.refreshToken, userId: user.id, expiresAt } });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...userWithoutPassword } = user as any;
    return { user: userWithoutPassword, tokens: retryTokens };
  }

  const { password: _pw2, ...userWithoutPassword } = user as any;
  return { user: userWithoutPassword, tokens };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const isPasswordValid = await bcrypt.compare(password, (user as any).password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const tokens = generateTokens(user as any);
  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION as string));
  try {
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt } });
  } catch (_e) {
    const retryTokens = generateTokens(user as any);
    await prisma.refreshToken.create({ data: { token: retryTokens.refreshToken, userId: user.id, expiresAt } });
    const { password: _pw3, ...userWithoutPassword2 } = user as any;
    return { user: userWithoutPassword2, tokens: retryTokens };
  }

  const { password: _pw4, ...userWithoutPassword } = user as any;
  return { user: userWithoutPassword, tokens };
};

export const refresh = async (oldRefreshToken: string) => {
  let payload: any;
  try {
    payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET as string);
  } catch (_err) {
    throw new ApiError(401, "Invalid refresh token.", "INVALID_TOKEN");
  }

  const tokenInDb = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
  if (!tokenInDb) {
    throw new ApiError(401, "Invalid refresh token.", "INVALID_TOKEN");
  }

  await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new ApiError(401, "User not found.", "USER_NOT_FOUND");
  }

  const tokens = generateTokens(user as any);
  const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRATION as string));
  await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt } });

  return { tokens };
};

export const logout = async (userId: string) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};


