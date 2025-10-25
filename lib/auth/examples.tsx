/**
 * Usage examples for authentication utilities
 * These examples demonstrate how to use the auth system in different contexts
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import {
  generateJWT,
  verifyJWT,
  getCurrentUser,
  requireAuth,
  setAuthCookie,
  clearAuthCookies,
  withAuth,
  isAuthenticated,
} from './index';

// ============================================
// Example 1: Server Component with Optional Auth
// ============================================

export async function ServerComponentExample() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please log in to view this content</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>User ID: {user.sub}</p>
    </div>
  );
}

// ============================================
// Example 2: Server Component with Required Auth
// ============================================

export async function ProtectedServerComponent() {
  try {
    const user = await requireAuth();

    return (
      <div>
        <h1>Protected Content</h1>
        <p>Email: {user.email}</p>
      </div>
    );
  } catch (error) {
    // Redirect to login if not authenticated
    redirect('/login');
  }
}

// ============================================
// Example 3: API Route with Manual Auth Check
// ============================================

export async function GET_ManualAuth(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Fetch user-specific data
    const data = await fetchUserData(user.sub);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// ============================================
// Example 4: API Route with withAuth Wrapper
// ============================================

export const GET_WithWrapper = withAuth(async (request, context) => {
  // User is guaranteed to be authenticated here
  const { params: { user } } = context;

  const data = await fetchUserData(user.sub);

  return NextResponse.json({
    userId: user.sub,
    email: user.email,
    data,
  });
});

// ============================================
// Example 5: Server Action for Login
// ============================================

export async function loginAction(formData: FormData) {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // Validate credentials (implement your own logic)
    const user = await validateUserCredentials(email, password);

    // Generate JWT token
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set authentication cookie
    await setAuthCookie(token);

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

// ============================================
// Example 6: Server Action for Logout
// ============================================

export async function logoutAction() {
  'use server';

  await clearAuthCookies();
  redirect('/login');
}

// ============================================
// Example 7: Server Action with Auth Check
// ============================================

export async function updateProfileAction(formData: FormData) {
  'use server';

  try {
    const user = await requireAuth();

    const name = formData.get('name') as string;

    // Update user profile
    await updateUserProfile(user.sub, { name });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }
}

// ============================================
// Example 8: Conditional Rendering Based on Auth
// ============================================

export async function ConditionalComponent() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    const user = await getCurrentUser();
    return <div>Welcome back, {user?.email}</div>;
  }

  return (
    <div>
      <a href='/login'>Login</a> or <a href='/register'>Register</a>
    </div>
  );
}

// ============================================
// Example 9: Layout with User Data
// ============================================

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <header>
        <nav>
          <span>Logged in as: {user.email}</span>
          <form action={logoutAction}>
            <button type='submit'>Logout</button>
          </form>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

// ============================================
// Example 10: API Route with Token Verification
// ============================================

export async function POST_VerifyToken(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Verify the token
    const payload = await verifyJWT(token);

    return NextResponse.json({
      valid: true,
      userId: payload.sub,
      email: payload.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      },
      { status: 401 }
    );
  }
}

// ============================================
// Helper Functions (implement these in your app)
// ============================================

async function fetchUserData(userId: string) {
  // Implement your data fetching logic
  return { userId, data: 'example' };
}

async function validateUserCredentials(email: string, password: string) {
  // Implement your credential validation logic
  return { id: 'user-id', email, name: 'User Name' };
}

async function updateUserProfile(userId: string, data: { name: string }) {
  // Implement your profile update logic
  return { success: true };
}
