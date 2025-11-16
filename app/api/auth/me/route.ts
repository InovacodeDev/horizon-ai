import { getSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 * Get current authenticated user data
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from token
    const session = await getSession();

    if (!session || !session.isAuthenticated) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // Return user ID from session
    return NextResponse.json({
      success: true,
      userId: session.user.sub,
      user: {
        id: session.user.sub,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);

    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      if (error.message.includes('Unauthorized') || error.message.includes('Invalid')) {
        return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
      }

      return NextResponse.json({ message: error.message || 'Failed to get user data' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Failed to get user data' }, { status: 500 });
  }
}
