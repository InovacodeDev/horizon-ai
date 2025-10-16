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
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-[560px] text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-on-surface mb-3">
              Conecte sua primeira conta
            </h1>
            <p className="text-base text-on-surface-variant">
              Comece conectando uma conta bancária para ver todas as suas
              informações financeiras em um só lugar.
            </p>
          </div>
          <Button
            onClick={() => router.push("/select-bank")}
            className="w-full max-w-xs h-10 bg-primary text-on-primary hover:bg-primary/90 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          >
            Conectar conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-card border-b border-outline/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-on-surface">
              Dashboard
            </h1>
            <Button
              onClick={() => router.push("/select-bank")}
              size="sm"
              className="bg-primary text-on-primary hover:bg-primary/90 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar conta
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}
