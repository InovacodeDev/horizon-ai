/**
 * Next.js Proxy for Authentication
 * Protects routes and handles redirections based on authentication status
 * Requirements: 6.1, 6.4, 6.5
 */
import { verifyJWT } from '@/lib/auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/', '/login', '/register', '/pricing'];

/**
 * Routes that should redirect to overview if user is already authenticated
 */
const AUTH_ROUTES = ['/login', '/register'];

/**
 * Check if a path matches any of the given routes
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route === pathname) return true;
    // Support for dynamic routes (e.g., /api/users/[id])
    if (route.includes('[') && pathname.startsWith(route.split('[')[0])) {
      return true;
    }
    return false;
  });
}

/**
 * Proxy function to handle authentication and route protection
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Get authentication token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // Check if the current path is a public route
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);

  // Check if the current path is an auth route (login/register)
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // If user has a token, verify it
  let isAuthenticated = false;
  if (token) {
    try {
      await verifyJWT(token);
      isAuthenticated = true;
    } catch (error) {
      // Token is invalid or expired
      console.error('Token verification failed:', error);
      isAuthenticated = false;

      // Clear invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');

      // Only redirect to login if trying to access protected route
      if (!isPublicRoute) {
        return response;
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect parameter to return user to intended page after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Proxy configuration
 * Specify which routes should be processed by this proxy
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
