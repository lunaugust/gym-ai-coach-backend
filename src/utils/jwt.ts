import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateJti = (): string =>
  typeof (crypto as any).randomUUID === "function"
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex");

export type AccessTokenPayload = {
  userId: string;
  email: string;
  name: string;
};

export type RefreshTokenPayload = {
  userId: string;
};

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION,
    jwtid: generateJti(),
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    jwtid: generateJti(),
  });
};

export const generateTokens = (user: { id: string; email: string; name: string }) => {
  const accessTokenPayload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
  const refreshTokenPayload: RefreshTokenPayload = {
    userId: user.id,
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);
  return { accessToken, refreshToken };
};


