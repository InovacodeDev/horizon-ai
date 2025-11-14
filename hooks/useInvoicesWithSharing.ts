'use client';

import type { InvoiceWithOwnership } from '@/lib/types/sharing.types';
import { useCallback, useEffect, useState } from 'react';

import { useAppwriteRealtime } from './useAppwriteRealtime';

interface UseInvoicesWithSharingOptions {
  enableRealtime?: boolean;
  filters?: {
    category?: string;
    merchant?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  };
}

/**
 * Hook for managing invoices with sharing support
 * Fetches both own and shared invoices with ownership metadata
 */
export function useInvoicesWithSharing(options: UseInvoicesWithSharingOptions = {}) {
  const { enableRealtime = true, filters } = options;
  const [invoices, setInvoices] = useState<InvoiceWithOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchInvoices = useCallback(async () => {
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

      // Build queries based on filters
      const queries = [];

      if (filters?.category) queries.push(Query.equal('category', filters.category));
      if (filters?.merchant) queries.push(Query.equal('merchant_name', filters.merchant));
      if (filters?.startDate) queries.push(Query.greaterThanEqual('issue_date', filters.startDate));
      if (filters?.endDate) queries.push(Query.lessThanEqual('issue_date', filters.endDate));
      if (filters?.minAmount) queries.push(Query.greaterThanEqual('total_amount', filters.minAmount));
      if (filters?.maxAmount) queries.push(Query.lessThanEqual('total_amount', filters.maxAmount));
      if (filters?.search) queries.push(Query.search('merchant_name', filters.search));

      // Default ordering by issue date descending
      queries.push(Query.orderDesc('issue_date'));

      const result = await databases.listRows({ databaseId, tableId: 'invoices', queries });

      // Note: This simplified version doesn't include sharing logic
      // For full sharing support, you would need to:
      // 1. Fetch user's own invoices
      // 2. Fetch sharing relationships
      // 3. Fetch shared invoices from related users
      // 4. Merge and deduplicate results
      const invoicesData = result.rows.map((doc: any) => ({
        ...doc,
        isOwner: true, // Simplified - all are owner's invoices
        ownerName: 'You',
      })) as InvoiceWithOwnership[];

      setInvoices(invoicesData);
      setInitialized(true);
    } catch (err: any) {
      console.error('Error fetching invoices with sharing:', err);
      setError(err.message || 'Failed to fetch invoices');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!initialized) {
      fetchInvoices();
    }
  }, [initialized, fetchInvoices]);

  // Refetch when filters change
  useEffect(() => {
    if (initialized) {
      fetchInvoices();
    }
  }, [filters, fetchInvoices, initialized]);

  // Setup realtime subscription for invoices
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.invoices.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchInvoices();
    },
    onCreate: () => {
      fetchInvoices();
    },
    onDelete: () => {
      fetchInvoices();
    },
  });

  // Setup realtime subscription for sharing relationships
  useAppwriteRealtime({
    channels: [`databases.${process.env.APPWRITE_DATABASE_ID}.collections.sharing_relationships.documents`],
    enabled: enableRealtime && initialized,
    onUpdate: () => {
      fetchInvoices();
    },
    onCreate: () => {
      fetchInvoices();
    },
    onDelete: () => {
      fetchInvoices();
    },
  });

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
  };
}
