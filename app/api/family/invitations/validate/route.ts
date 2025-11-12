import { getCurrentUserId } from '@/lib/auth/session';
import { InvitationService } from '@/lib/services/invitation.service';
import { SharingService } from '@/lib/services/sharing.service';
import { UserService } from '@/lib/services/user.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/family/invitations/validate
 * Validate an invitation token and return invitation details
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token do convite é obrigatório',
        },
        { status: 400 },
      );
    }

    // Get invitation by token
    const invitationService = new InvitationService();
    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Convite inválido',
        },
        { status: 404 },
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: 'Este convite já foi processado',
        },
        { status: 400 },
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: 'Este convite expirou',
        },
        { status: 400 },
      );
    }

    // Get responsible user details
    const userService = new UserService();
    const responsibleUser = await userService.findUserById(invitation.responsible_user_id);

    if (!responsibleUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuário responsável não encontrado',
        },
        { status: 404 },
      );
    }

    // Check if current user can accept the invitation
    let canAccept = true;
    let reason: string | undefined;

    // Get current user ID (if authenticated)
    const currentUserId = await getCurrentUserId();

    if (currentUserId) {
      // Check if current user already has an active relationship
      const sharingService = new SharingService();
      const hasActiveRelationship = await sharingService.hasActiveRelationship(currentUserId);

      if (hasActiveRelationship) {
        canAccept = false;
        reason = 'Você já possui uma conta conjunta ativa';
      }

      // Check if current user is the invited user
      const currentUser = await userService.findUserById(currentUserId);
      if (currentUser && currentUser.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
        canAccept = false;
        reason = 'Este convite não foi enviado para você';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        invitation,
        responsibleUser: {
          name: responsibleUser.name,
          email: responsibleUser.email,
        },
        canAccept,
        reason,
      },
    });
  } catch (error: any) {
    console.error('GET /api/family/invitations/validate error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to validate invitation',
      },
      { status: 500 },
    );
  }
}
