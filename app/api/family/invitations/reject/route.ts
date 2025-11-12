import { getCurrentUserId } from '@/lib/auth/session';
import { InvitationService } from '@/lib/services/invitation.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/family/invitations/reject
 * Reject an invitation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Token do convite é obrigatório',
        },
        { status: 400 },
      );
    }

    // Reject invitation
    const invitationService = new InvitationService();
    await invitationService.rejectInvitation(body.token, userId);

    return NextResponse.json({
      success: true,
      message: 'Convite rejeitado com sucesso',
    });
  } catch (error: any) {
    console.error('POST /api/family/invitations/reject error:', error);

    // Handle specific error messages
    const errorMessage = error.message || 'Failed to reject invitation';
    let statusCode = 500;

    // Map specific errors to appropriate status codes
    if (
      errorMessage.includes('inválido') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('não encontrado') ||
      errorMessage.includes('not found')
    ) {
      statusCode = 404;
    } else if (
      errorMessage.includes('já foi processado') ||
      errorMessage.includes('already processed') ||
      errorMessage.includes('não foi enviado para você') ||
      errorMessage.includes('not sent to you')
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
