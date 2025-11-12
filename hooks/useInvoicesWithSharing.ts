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

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      const url = `/api/sharing/invoices${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices with sharing');
      }

      const data = await response.json();
      setInvoices(data.data || []);
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
