import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured");
}

export interface AccessTokenPayload {
  userId: string;
  role: "FREE" | "PREMIUM";
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string; // JWT ID for token identification
}

/**
 * Generate an Access Token with 15 minutes expiration
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * Generate a Refresh Token with 7 days expiration
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  // Extract jti from payload to use as jwtid option
  const { jti, ...tokenPayload } = payload;
  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: jti,
  });
}

/**
 * Verify and decode an Access Token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify and decode a Refresh Token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
