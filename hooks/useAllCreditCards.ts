'use client';

import { useUser } from '@/lib/contexts/UserContext';
import type { CreditCard } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseAllCreditCardsOptions {
  accountId?: string;
  enableRealtime?: boolean;
}

// Global state para evitar múltiplas chamadas simultâneas (por usuário)
const globalCreditCardsByUser: Map<string, CreditCard[]> = new Map();
const globalFetchPromiseByUser: Map<string, Promise<CreditCard[]>> = new Map();

/**
 * Hook otimizado para gerenciar cartões de crédito com realtime
 * - Batch loading (carrega todos os cartões de uma vez)
 * - Realtime subscribe compartilhado entre todos os componentes
 * - Deduplicação de requests
 */
export function useAllCreditCards(options: UseAllCreditCardsOptions = {}) {
  const { accountId, enableRealtime = true } = options;
  const { user } = useUser();

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    const userCards = globalCreditCardsByUser.get(user.$id);
    if (userCards) {
      return accountId ? userCards.filter((c) => c.account_id === accountId) : userCards;
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!!globalCreditCardsByUser.get(user.$id));
  const mountedRef = useRef(true);

  const fetchCreditCards = useCallback(
    async (silent = false) => {
      const userFetchPromise = globalFetchPromiseByUser.get(user.$id);

      if (userFetchPromise) {
        try {
          const data = await userFetchPromise;
          if (mountedRef.current) {
            setCreditCards(accountId ? data.filter((c) => c.account_id === accountId) : data);
          }
          return data;
        } catch (err) {
          return [];
        }
      }

      const fetchPromise = (async () => {
        try {
          if (!silent && mountedRef.current) setLoading(true);
          setError(null);

          const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
          const { Query } = await import('appwrite');

          const databases = getAppwriteBrowserDatabases();
          const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

          if (!databaseId) {
            throw new Error('Database ID not configured');
          }

          // Primeiro, buscar todas as contas do usuário (próprias)
          const accountsResult = await databases.listRows({
            databaseId,
            tableId: 'accounts',
            queries: [Query.equal('user_id', user.$id)],
          });

          const userAccountIds = accountsResult.rows.map((account: any) => account.$id);

          // Buscar contas compartilhadas (onde o usuário é membro)
          const sharingResult = await databases.listRows({
            databaseId,
            tableId: 'sharing_relationships',
            queries: [Query.equal('member_user_id', user.$id), Query.equal('status', 'active')],
          });

          // Adicionar IDs das contas compartilhadas
          const sharedAccountIds = sharingResult.rows.map((rel: any) => {
            // Buscar contas do responsible_user_id
            return rel.responsible_user_id;
          });

          // Se há contas compartilhadas, buscar seus IDs
          let allAccountIds = [...userAccountIds];
          if (sharedAccountIds.length > 0) {
            const sharedAccountsResult = await databases.listRows({
              databaseId,
              tableId: 'accounts',
              queries: [Query.equal('user_id', sharedAccountIds)],
            });
            const sharedAccIds = sharedAccountsResult.rows.map((acc: any) => acc.$id);
            allAccountIds = [...allAccountIds, ...sharedAccIds];
          }

          // Se não há contas, retorna vazio
          if (allAccountIds.length === 0) {
            const emptyData: CreditCard[] = [];
            globalCreditCardsByUser.set(user.$id, emptyData);
            if (mountedRef.current) {
              setCreditCards(emptyData);
              setInitialized(true);
            }
            return emptyData;
          }

          // Buscar apenas cartões vinculados às contas do usuário ou compartilhadas
          const queries = [Query.equal('account_id', allAccountIds), Query.orderDesc('created_at'), Query.limit(100)];

          const result = await databases.listRows({ databaseId, tableId: 'credit_cards', queries });
          const cardsData = result.rows as unknown as CreditCard[];

          globalCreditCardsByUser.set(user.$id, cardsData);

          if (mountedRef.current) {
            setCreditCards(accountId ? cardsData.filter((c: CreditCard) => c.account_id === accountId) : cardsData);
            setInitialized(true);
          }

          return cardsData;
        } catch (err: any) {
          console.warn('Error fetching credit cards:', err);
          const emptyData: CreditCard[] = [];
          if (mountedRef.current) {
            setCreditCards(emptyData);
            setError(null);
            setInitialized(true);
          }
          return emptyData;
        } finally {
          if (!silent && mountedRef.current) setLoading(false);
          globalFetchPromiseByUser.delete(user.$id);
        }
      })();

      globalFetchPromiseByUser.set(user.$id, fetchPromise);
      return fetchPromise;
    },
    [accountId, user.$id],
  );

  useEffect(() => {
    if (!initialized) {
      fetchCreditCards();
    }
  }, [initialized, fetchCreditCards]);

  // Setup realtime subscription usando subscrição global compartilhada
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;
  useAppwriteRealtime({
    channels: databaseId ? [`databases.${databaseId}.collections.credit_cards.documents`] : [],
    enabled: enableRealtime && initialized,
    onCreate: async (payload: CreditCard) => {
      console.log('📡 Realtime: credit card created', payload.$id);
      // Validar se o cartão pertence a uma conta do usuário antes de atualizar
      const userCards = globalCreditCardsByUser.get(user.$id) || [];
      const belongsToUser = await validateCardOwnership(payload.account_id, user.$id);
      if (belongsToUser) {
        fetchCreditCards(true);
      }
    },
    onUpdate: async (payload: CreditCard) => {
      console.log('📡 Realtime: credit card updated', payload.$id);
      // Validar se o cartão pertence a uma conta do usuário antes de atualizar
      const belongsToUser = await validateCardOwnership(payload.account_id, user.$id);
      if (belongsToUser) {
        fetchCreditCards(true);
      }
    },
    onDelete: async (payload: CreditCard) => {
      console.log('📡 Realtime: credit card deleted', payload.$id);
      // Validar se o cartão pertencia a uma conta do usuário antes de atualizar
      const belongsToUser = await validateCardOwnership(payload.account_id, user.$id);
      if (belongsToUser) {
        fetchCreditCards(true);
      }
    },
  });

  // Função auxiliar para validar propriedade do cartão
  async function validateCardOwnership(accountId: string, userId: string): Promise<boolean> {
    try {
      const { getAppwriteBrowserDatabases } = await import('@/lib/appwrite/client-browser');
      const { Query } = await import('appwrite');
      const databases = getAppwriteBrowserDatabases();
      const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID;

      if (!databaseId) return false;

      // Verificar se a conta pertence ao usuário
      const accountResult = await databases.listRows({
        databaseId,
        tableId: 'accounts',
        queries: [Query.equal('$id', accountId), Query.equal('user_id', userId)],
      });

      if (accountResult.rows.length > 0) return true;

      // Verificar se a conta é compartilhada com o usuário
      const account = await databases.getRow({ databaseId, tableId: 'accounts', rowId: accountId });
      const sharingResult = await databases.listRows({
        databaseId,
        tableId: 'sharing_relationships',
        queries: [
          Query.equal('member_user_id', userId),
          Query.equal('responsible_user_id', (account as any).user_id),
          Query.equal('status', 'active'),
        ],
      });

      return sharingResult.rows.length > 0;
    } catch (err) {
      console.error('Error validating card ownership:', err);
      return false;
    }
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const userCards = globalCreditCardsByUser.get(user.$id);
    if (userCards) {
      setCreditCards(accountId ? userCards.filter((c) => c.account_id === accountId) : userCards);
    }
  }, [accountId, user.$id]);

  const deleteCreditCard = useCallback(
    async (cardId: string) => {
      let deletedCard: CreditCard | undefined;

      setCreditCards((prev) => {
        deletedCard = prev.find((c) => c.$id === cardId);
        return prev.filter((c) => c.$id !== cardId);
      });

      const userCards = globalCreditCardsByUser.get(user.$id);
      if (userCards) {
        globalCreditCardsByUser.set(
          user.$id,
          userCards.filter((c) => c.$id !== cardId),
        );
      }

      try {
        setError(null);
        const response = await fetch(`/api/credit-cards/${cardId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete credit card');
        }
      } catch (err: any) {
        console.error('Error deleting credit card:', err);
        setError(err.message || 'Failed to delete credit card');

        if (deletedCard) {
          setCreditCards((prev) => [...prev, deletedCard!]);
          const userCards = globalCreditCardsByUser.get(user.$id);
          if (userCards) {
            globalCreditCardsByUser.set(user.$id, [...userCards, deletedCard]);
          }
        }
        throw err;
      }
    },
    [user.$id],
  );

  const refetch = useCallback(() => {
    globalCreditCardsByUser.delete(user.$id);
    fetchCreditCards();
  }, [fetchCreditCards, user.$id]);

  return {
    creditCards,
    loading,
    error,
    refetch,
    deleteCreditCard,
  };
}
