import { getCurrentUserId } from '@/lib/auth/session';
import { InvitationService } from '@/lib/services/invitation.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/family/invitations/[id]/resend
 * Resend invitation email
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get invitation ID from params
    const { id: invitationId } = await params;

    if (!invitationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID do convite é obrigatório',
        },
        { status: 400 },
      );
    }

    // Resend invitation
    const invitationService = new InvitationService();
    await invitationService.resendInvitation(invitationId, userId);

    return NextResponse.json({
      success: true,
      message: 'Convite reenviado com sucesso',
    });
  } catch (error: any) {
    console.error('POST /api/family/invitations/[id]/resend error:', error);

    // Handle specific error messages
    const errorMessage = error.message || 'Failed to resend invitation';
    let statusCode = 500;

    // Map specific errors to appropriate status codes
    if (errorMessage.includes('não encontrado') || errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (
      errorMessage.includes('não tem permissão') ||
      errorMessage.includes('not authorized') ||
      errorMessage.includes('permission')
    ) {
      statusCode = 403;
    } else if (
      errorMessage.includes('Apenas convites pendentes') ||
      errorMessage.includes('Only pending') ||
      errorMessage.includes('expirou') ||
      errorMessage.includes('expired')
    ) {
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: statusCode },
    );
  }
}
