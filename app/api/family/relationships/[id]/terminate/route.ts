import { getCurrentUserId } from '@/lib/auth/session';
import { SharingService } from '@/lib/services/sharing.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/family/relationships/[id]/terminate
 * Terminate a sharing relationship
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get relationship ID from params
    const { id: relationshipId } = await params;

    if (!relationshipId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID do relacionamento é obrigatório',
        },
        { status: 400 },
      );
    }

    // Terminate relationship
    const sharingService = new SharingService();
    await sharingService.terminateRelationship(relationshipId, userId);

    return NextResponse.json({
      success: true,
      message: 'Relacionamento encerrado com sucesso',
    });
  } catch (error: any) {
    console.error('POST /api/family/relationships/[id]/terminate error:', error);

    // Handle specific error messages
    const errorMessage = error.message || 'Failed to terminate relationship';
    let statusCode = 500;

    // Map specific errors to appropriate status codes
    if (errorMessage.includes('não encontrado') || errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('não tem permissão') || errorMessage.includes('permission')) {
      statusCode = 403;
    } else if (errorMessage.includes('já foi encerrado') || errorMessage.includes('already terminated')) {
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
