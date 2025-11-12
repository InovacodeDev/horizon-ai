import { getCurrentUserId } from '@/lib/auth/session';
import { SharingService } from '@/lib/services/sharing.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/family/relationships
 * Fetch current user's active relationship with role information
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active relationship
    const sharingService = new SharingService();
    const relationship = await sharingService.getActiveRelationship(userId);

    if (!relationship) {
      return NextResponse.json({
        success: true,
        data: {
          relationship: null,
          role: null,
        },
      });
    }

    // Determine user's role in the relationship
    const isResponsible = relationship.responsible_user_id === userId;
    const role = isResponsible ? 'responsible' : 'member';

    // Get detailed relationship information
    const relationshipDetails = await sharingService.getRelationshipDetails(relationship.$id);

    return NextResponse.json({
      success: true,
      data: {
        relationship: relationshipDetails,
        role,
      },
    });
  } catch (error: any) {
    console.error('GET /api/family/relationships error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch relationship',
      },
      { status: 500 },
    );
  }
}
