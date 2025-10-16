import { serialize, CookieSerializeOptions } from "cookie";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Default secure cookie options
 */
const defaultCookieOptions: CookieSerializeOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

/**
 * Serialize an access token cookie (15 minutes)
 */
export function serializeAccessTokenCookie(token: string): string {
  return serialize("accessToken", token, {
    ...defaultCookieOptions,
    maxAge: 15 * 60, // 15 minutes in seconds
  });
}

/**
 * Serialize a refresh token cookie (7 days)
 */
export function serializeRefreshTokenCookie(token: string): string {
  return serialize("refreshToken", token, {
    ...defaultCookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Serialize a cookie to clear/delete it
 */
export function serializeClearCookie(name: string): string {
  return serialize(name, "", {
    ...defaultCookieOptions,
    maxAge: 0,
  });
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(
  cookieHeader: string | null
): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (cookies, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
      return cookies;
    },
    {} as Record<string, string>
  );
}
