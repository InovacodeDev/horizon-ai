import { getCurrentUserId } from '@/lib/auth/session';
import { InvitationService } from '@/lib/services/invitation.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/family/invitations
 * List all invitations for the authenticated user (as responsible user)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invitations
    const invitationService = new InvitationService();
    const invitations = await invitationService.getInvitationsByResponsible(userId);

    return NextResponse.json({
      success: true,
      data: {
        invitations,
      },
    });
  } catch (error: any) {
    console.error('GET /api/family/invitations error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch invitations',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/family/invitations
 * Create a new invitation
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
    if (!body.invitedEmail || typeof body.invitedEmail !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email do convidado é obrigatório',
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.invitedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Formato de email inválido',
        },
        { status: 400 },
      );
    }

    // Create invitation
    const invitationService = new InvitationService();
    const invitation = await invitationService.createInvitation(userId, body.invitedEmail);

    return NextResponse.json(
      {
        success: true,
        data: {
          invitation,
        },
        message: 'Convite criado com sucesso',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('POST /api/family/invitations error:', error);

    // Handle specific error messages
    const errorMessage = error.message || 'Failed to create invitation';
    let statusCode = 500;

    // Map specific errors to appropriate status codes
    if (
      errorMessage.includes('não encontrado') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('Usuário não encontrado')
    ) {
      statusCode = 404;
    } else if (
      errorMessage.includes('já possui') ||
      errorMessage.includes('already has') ||
      errorMessage.includes('Já existe') ||
      errorMessage.includes('não pode convidar a si mesmo')
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
