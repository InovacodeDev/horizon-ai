/**
 * Authentication middleware utilities for Next.js
 * Migrated from NestJS guards
 */
import { NextRequest, NextResponse } from 'next/server';

import { verifyJWT } from './jwt';

/**
 * Route configuration
 */
export const PUBLIC_ROUTES = ['/', '/login', '/register', '/pricing'];
export const AUTH_ROUTES = ['/login', '/register'];
export const PROTECTED_ROUTE_PREFIX = [
  '/overview',
  '/accounts',
  '/transactions',
  '/categories',
  '/analytics',
  '/credit',
  '/invoices',
  '/taxes',
  '/warranties',
  '/planning-goals',
  '/shopping-list',
  '/succession',
  '/insurance',
  '/retirement',
  '/family',
  '/compliance',
  '/integrations',
  '/marketplace',
  '/notifications',
  '/settings',
  '/help',
];

/**
 * Check if a path is a public route
 * @param pathname - Request pathname
 * @returns true if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/');
}

/**
 * Check if a path is an auth route (login/register)
 * @param pathname - Request pathname
 * @returns true if route is auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

/**
 * Check if a path is a protected route
 * @param pathname - Request pathname
 * @returns true if route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) {
    return false;
  }

  return PROTECTED_ROUTE_PREFIX.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Verify authentication token from request
 * @param request - Next.js request object
 * @returns JWT payload or null if invalid
 */
export async function verifyRequestAuth(request: NextRequest) {
  try {
    // Try to get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Try Authorization header as fallback
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        return await verifyJWT(headerToken);
      }
      return null;
    }

    return await verifyJWT(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Create redirect response to login
 * @param request - Next.js request object
 * @returns NextResponse redirect to login
 */
export function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);

  // Add return URL as query parameter
  if (request.nextUrl.pathname !== '/') {
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
  }

  const response = NextResponse.redirect(loginUrl);

  // Clear invalid auth cookie
  response.cookies.delete('auth_token');

  return response;
}

/**
 * Create redirect response to overview (default authenticated page)
 * @param request - Next.js request object
 * @returns NextResponse redirect to overview
 */
export function redirectToOverview(request: NextRequest): NextResponse {
  // Check if there's a return URL
  const returnUrl = request.nextUrl.searchParams.get('returnUrl');

  if (returnUrl && !isAuthRoute(returnUrl)) {
    return NextResponse.redirect(new URL(returnUrl, request.url));
  }

  return NextResponse.redirect(new URL('/overview', request.url));
}

/**
 * Create unauthorized response for API routes
 * @param message - Error message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

/**
 * Create forbidden response for API routes
 * @param message - Error message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

/**
 * Middleware handler for authentication
 * This can be used in app/middleware.ts
 * @param request - Next.js request object
 * @returns NextResponse or null to continue
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return null; // Continue to next middleware or route
  }

  // Verify authentication
  const user = await verifyRequestAuth(request);

  // Protected routes require authentication
  if (isProtectedRoute(pathname)) {
    if (!user) {
      return redirectToLogin(request);
    }
    return null; // Authenticated, continue
  }

  // Auth routes (login/register) redirect to overview if already authenticated
  if (isAuthRoute(pathname)) {
    if (user) {
      return redirectToOverview(request);
    }
    return null; // Not authenticated, show auth page
  }

  // Default: allow access
  return null;
}

/**
 * API route authentication wrapper
 * Use this to protect API routes
 * @param handler - API route handler
 * @returns Wrapped handler with auth check
 */
export function withAuth(
  handler: (request: NextRequest, context: { params: any; user?: any }) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: { params: any }) => {
    const user = await verifyRequestAuth(request);

    if (!user) {
      return unauthorizedResponse('Authentication required');
    }

    // Add user to request context (can be accessed in handler)
    // Note: Next.js doesn't support modifying request object directly
    // So we'll pass user through headers or context
    return handler(request, { ...context, user });
  };
}

/**
 * Optional authentication wrapper for API routes
 * Allows both authenticated and unauthenticated access
 * @param handler - API route handler
 * @returns Wrapped handler with optional auth
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context: { params: any; user?: any }) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: { params: any }) => {
    const user = await verifyRequestAuth(request);

    return handler(request, { ...context, user: user || undefined });
  };
}
