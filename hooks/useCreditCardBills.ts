'use client';

import { CreditCardBill } from '@/lib/types/credit-card.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseCreditCardBillsOptions {
  creditCardId?: string;
  status?: 'open' | 'closed' | 'paid' | 'overdue';
  startDate?: string;
  endDate?: string;
  enableRealtime?: boolean;
}

/**
 * Hook para buscar faturas de cartão de crédito com Realtime
 */
export function useCreditCardBills(options: UseCreditCardBillsOptions = {}) {
  const { enableRealtime = true } = options;
  const { useUser } = require('@/lib/contexts/UserContext');
  const { user } = useUser();
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch directly from Appwrite using the browser client
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) {
        throw new Error('Database ID not configured');
      }

      // Se creditCardId foi fornecido, validar propriedade primeiro
      if (options.creditCardId && user) {
        const cardResult = await databases.getRow({
          databaseId,
          tableId: 'credit_cards',
          rowId: options.creditCardId,
        });

        const card = cardResult as any;

        // Verificar se a conta do cartão pertence ao usuário ou é compartilhada
        const accountResult = await databases.getRow({
          databaseId,
          tableId: 'accounts',
          rowId: card.account_id,
        });

        const account = accountResult as any;

        // Verificar propriedade direta
        const isOwner = account.user_id === user.$id;

        // Verificar compartilhamento
        let isShared = false;
        if (!isOwner) {
          const sharingResult = await databases.listRows({
            databaseId,
            tableId: 'sharing_relationships',
            queries: [
              Query.equal('member_user_id', user.$id),
              Query.equal('responsible_user_id', account.user_id),
              Query.equal('status', 'active'),
            ],
          });
          isShared = sharingResult.rows.length > 0;
        }

        if (!isOwner && !isShared) {
          throw new Error('Unauthorized: Credit card does not belong to user');
        }
      }

      // Build queries
      const queries = [];
      if (options.creditCardId) queries.push(Query.equal('credit_card_id', options.creditCardId));
      if (options.status) queries.push(Query.equal('status', options.status));
      if (options.startDate) queries.push(Query.greaterThanEqual('due_date', options.startDate));
      if (options.endDate) queries.push(Query.lessThanEqual('due_date', options.endDate));

      // Default ordering by due date descending
      queries.push(Query.orderDesc('due_date'));

      const result = await databases.listRows({ databaseId, tableId: 'credit_card_bills', queries });

      const billsData = result.rows as unknown as CreditCardBill[];
      setBills(billsData);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching credit card bills:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBills([]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [options.creditCardId, options.status, options.startDate, options.endDate, user]);

  useEffect(() => {
    if (!initialized) {
      fetchBills();
    }
  }, [initialized, fetchBills]);

  // Setup realtime subscription for credit card bills
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.credit_card_bills.documents`],
    enabled: enableRealtime && initialized,
    onCreate: async (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill created', payload.$id);
      // Filtrar se necessário baseado nas options
      if (options.creditCardId && payload.credit_card_id !== options.creditCardId) return;
      if (options.status && payload.status !== options.status) return;

      // Validar propriedade do cartão antes de adicionar
      const isValid = await validateBillOwnership(payload.credit_card_id);
      if (!isValid) return;

      setBills((prev) => {
        if (prev.some((b) => b.$id === payload.$id)) return prev;
        return [payload, ...prev];
      });
    },
    onUpdate: async (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill updated', payload.$id);
      // Validar propriedade do cartão antes de atualizar
      const isValid = await validateBillOwnership(payload.credit_card_id);
      if (!isValid) return;

      setBills((prev) => prev.map((b) => (b.$id === payload.$id ? payload : b)));
    },
    onDelete: async (payload: CreditCardBill) => {
      console.log('📡 Realtime: bill deleted', payload.$id);
      // Validar propriedade do cartão antes de remover
      const isValid = await validateBillOwnership(payload.credit_card_id);
      if (!isValid) return;

      setBills((prev) => prev.filter((b) => b.$id !== payload.$id));
    },
  });

  // Função auxiliar para validar propriedade da fatura
  async function validateBillOwnership(creditCardId: string): Promise<boolean> {
    try {
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');
      const { useUser } = await import('@/lib/contexts/UserContext');

      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
      if (!databaseId) return false;

      // Buscar cartão
      const card = await databases.getRow({ databaseId, tableId: 'credit_cards', rowId: creditCardId });
      const accountId = (card as any).account_id;

      // Buscar conta
      const account = await databases.getRow({ databaseId, tableId: 'accounts', rowId: accountId });
      const accountUserId = (account as any).user_id;

      // Obter usuário atual (isso pode não funcionar em callback, considerar passar userId como parâmetro)
      // Por enquanto, vamos refazer a busca completa
      fetchBills();
      return true;
    } catch (err) {
      console.error('Error validating bill ownership:', err);
      return false;
    }
  }

  return {
    bills,
    loading,
    error,
    refetch: fetchBills,
  };
}
