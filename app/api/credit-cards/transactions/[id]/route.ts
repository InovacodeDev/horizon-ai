import { getCurrentUserId } from '@/lib/auth/session';
import { CreditCardTransactionService } from '@/lib/services/credit-card-transaction.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/credit-cards/transactions/[id]
 * Get a specific credit card transaction
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: transactionId } = await params;

    const creditCardTransactionService = new CreditCardTransactionService();
    const transaction = await creditCardTransactionService.getTransactionById(transactionId);

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.user_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('GET /api/credit-cards/transactions/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch transaction',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/credit-cards/transactions/[id]
 * Update a credit card transaction
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: transactionId } = await params;

    const creditCardTransactionService = new CreditCardTransactionService();
    const existing = await creditCardTransactionService.getTransactionById(transactionId);

    if (!existing) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate amount if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return NextResponse.json({ message: 'Amount must be a positive number' }, { status: 400 });
    }

    const transaction = await creditCardTransactionService.updateTransaction(transactionId, {
      amount: body.amount,
      date: body.date,
      category: body.category,
      description: body.description,
      merchant: body.merchant,
      status: body.status,
    });

    // Check if should apply to future installments
    if (body.applyToFutureInstallments && existing.installments && existing.installments > 1) {
      try {
        const { getAppwriteDatabases } = await import('@/lib/appwrite/client');
        const { COLLECTIONS, DATABASE_ID } = await import('@/lib/appwrite/schema');
        const { Query } = await import('node-appwrite');

        const databases = getAppwriteDatabases();

        const futureInstallments = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, [
          Query.equal('user_id', userId),
          Query.equal('credit_card_id', existing.credit_card_id),
          Query.equal('purchase_date', existing.purchase_date),
          Query.greaterThan('installment', existing.installment || 1),
          Query.limit(100),
        ]);

        for (const futureInstallment of futureInstallments.documents) {
          await creditCardTransactionService.updateTransaction(futureInstallment.$id, {
            amount: body.amount,
            category: body.category,
            description: body.description,
            merchant: body.merchant,
          });
        }
      } catch (error) {
        console.error('Error updating future installments:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('PATCH /api/credit-cards/transactions/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update transaction',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/credit-cards/transactions/[id]
 * Delete a credit card transaction
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: transactionId } = await params;

    const creditCardTransactionService = new CreditCardTransactionService();
    const existing = await creditCardTransactionService.getTransactionById(transactionId);

    if (!existing) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await creditCardTransactionService.deleteTransaction(transactionId);

    // Check if should delete future installments
    const { searchParams } = new URL(request.url);
    const applyToFutureInstallments = searchParams.get('applyToFutureInstallments') === 'true';

    let deletedCount = 1;
    if (applyToFutureInstallments && existing.installments && existing.installments > 1) {
      try {
        const { getAppwriteDatabases } = await import('@/lib/appwrite/client');
        const { COLLECTIONS, DATABASE_ID } = await import('@/lib/appwrite/schema');
        const { Query } = await import('node-appwrite');

        const databases = getAppwriteDatabases();

        const futureInstallments = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CREDIT_CARD_TRANSACTIONS, [
          Query.equal('user_id', userId),
          Query.equal('credit_card_id', existing.credit_card_id),
          Query.equal('purchase_date', existing.purchase_date),
          Query.greaterThan('installment', existing.installment || 1),
          Query.limit(100),
        ]);

        for (const futureInstallment of futureInstallments.documents) {
          await creditCardTransactionService.deleteTransaction(futureInstallment.$id);
          deletedCount++;
        }
      } catch (error) {
        console.error('Error deleting future installments:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Transaction${deletedCount > 1 ? 's' : ''} deleted successfully`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('DELETE /api/credit-cards/transactions/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to delete transaction',
      },
      { status: 500 },
    );
  }
}
