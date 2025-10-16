import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { parseCookies } from "@/lib/auth/cookies";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/api/v1/dashboard",
  "/api/v1/of",
];

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Skip auth check for refresh endpoint
  if (pathname === "/api/v1/auth/refresh") {
    return NextResponse.next();
  }

  // Get cookies
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies.accessToken;
  const refreshToken = cookies.refreshToken;

  // Try to verify access token
  let userId: string | null = null;
  let isAccessTokenValid = false;

  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      userId = payload.userId;
      isAccessTokenValid = true;
    } catch (error) {
      // Access token is invalid or expired
      isAccessTokenValid = false;
    }
  }

  // Handle protected routes
  if (isProtectedRoute) {
    // If access token is valid, allow access
    if (isAccessTokenValid && userId) {
      const response = NextResponse.next();
      // Attach userId to request headers for API routes
      response.headers.set("x-user-id", userId);
      return response;
    }

    // If access token is invalid but refresh token exists, try to refresh
    if (!isAccessTokenValid && refreshToken) {
      try {
        // Call refresh endpoint
        const refreshResponse = await fetch(
          new URL("/api/v1/auth/refresh", request.url),
          {
            method: "POST",
            headers: {
              cookie: `refreshToken=${refreshToken}`,
            },
          }
        );

        if (refreshResponse.ok) {
          // Get new cookies from refresh response
          const setCookieHeaders = refreshResponse.headers.getSetCookie();

          // Create response and forward new cookies
          const response = NextResponse.next();

          // Set the new cookies
          setCookieHeaders.forEach((cookie) => {
            response.headers.append("Set-Cookie", cookie);
          });

          // Extract userId from new access token
          const newCookies = parseCookies(
            setCookieHeaders
              .join("; ")
              .replace(/; Path=\/; HttpOnly; Secure; SameSite=Strict/g, "")
          );
          const newAccessToken = newCookies.accessToken;

          if (newAccessToken) {
            try {
              const payload = verifyAccessToken(newAccessToken);
              response.headers.set("x-user-id", payload.userId);
            } catch (error) {
              // Should not happen, but handle gracefully
            }
          }

          return response;
        }
      } catch (error) {
        console.error("Error refreshing token in middleware:", error);
      }
    }

    // If we reach here, authentication failed - redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle auth routes (login, register)
  if (isAuthRoute && isAccessTokenValid && userId) {
    // User is already authenticated, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow all other routes
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
