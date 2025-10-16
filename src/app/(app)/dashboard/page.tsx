"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConsolidatedBalance } from "@/components/dashboard/ConsolidatedBalance";
import { TransactionFeed } from "@/components/dashboard/TransactionFeed";
import { AccountList } from "@/components/dashboard/AccountList";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyDashboard } from "@/components/states/EmptyDashboard";
import { Plus } from "lucide-react";

interface DashboardData {
  consolidatedBalance: {
    total: number;
    currency: string;
    byType: Record<string, number>;
  };
  accounts: Array<{
    id: string;
    name: string;
    accountType: string;
    accountNumber: string | null;
    balance: number;
    currency: string;
    institutionName: string;
    lastSync: string | null;
    status: string;
    connectionId: string;
  }>;
  transactions: {
    data: Array<{
      id: string;
      type: "DEBIT" | "CREDIT";
      amount: number;
      description: string;
      category: string | null;
      date: string;
      accountName: string;
      accountType: string;
      institutionName: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/v1/dashboard");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Auto-refresh when user returns to app
    refetchInterval: 60 * 60 * 1000, // Auto-refresh every hour
  });

  // Auto-sync connections if last sync was more than 1 hour ago
  useEffect(() => {
    if (!dashboard?.accounts) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find accounts that need syncing
    const accountsToSync = dashboard.accounts.filter((account) => {
      if (account.status !== "ACTIVE") return false;
      if (!account.lastSync) return true; // Never synced

      const lastSyncDate = new Date(account.lastSync);
      return lastSyncDate < oneHourAgo;
    });

    // Trigger sync for each account (rate limiting will be handled by the API)
    accountsToSync.forEach((account) => {
      fetch("/api/v1/of/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionId: account.connectionId }),
      })
        .then((response) => {
          if (response.ok) {
            console.log(`Auto-synced connection ${account.connectionId}`);
            // Invalidate dashboard query to refresh data
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }
        })
        .catch((error) => {
          console.error("Auto-sync failed:", error);
        });
    });
  }, [dashboard?.accounts, queryClient]);

  if (isLoading) {
    return <LoadingState message="Carregando seu dashboard..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar dashboard"
        message={
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard"
        }
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state - no accounts connected
  if (!dashboard || dashboard.accounts.length === 0) {
    return <EmptyDashboard onConnectBank={() => router.push("/select-bank")} />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-on-surface">Dashboard</h1>
        <Button
          onClick={() => router.push("/select-bank")}
          size="sm"
          className="bg-primary text-on-primary hover:bg-primary/90 rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar conta
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Balance and Accounts */}
        <div className="lg:col-span-1 space-y-6">
          <ConsolidatedBalance
            total={dashboard.consolidatedBalance.total}
            currency={dashboard.consolidatedBalance.currency}
            byType={dashboard.consolidatedBalance.byType}
          />
          <AccountList accounts={dashboard.accounts} />
        </div>

        {/* Right Column - Transaction Feed */}
        <div className="lg:col-span-2">
          <TransactionFeed initialData={dashboard.transactions} />
        </div>
      </div>
    </main>
  );
}
