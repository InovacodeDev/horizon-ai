import { NextRequest } from "next/server";
import { verifyAccessToken } from "./tokens";
import { parseCookies } from "./cookies";

/**
 * Extract and verify userId from request
 * This should be used in API routes to get the authenticated user
 */
export function getUserIdFromRequest(request: NextRequest): string {
  // First try to get from middleware header (preferred)
  const userIdFromHeader = request.headers.get("x-user-id");
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  // Fallback: verify token directly (in case middleware didn't run)
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    throw new Error("Unauthorized: No access token");
  }

  try {
    const payload = verifyAccessToken(accessToken);
    return payload.userId;
  } catch (error) {
    throw new Error("Unauthorized: Invalid access token");
  }
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  try {
    getUserIdFromRequest(request);
    return true;
  } catch {
    return false;
  }
}
