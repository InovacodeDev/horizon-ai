"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Unplug, Building2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Account {
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
}

interface AccountListProps {
  accounts: Account[];
  isLoading?: boolean;
}

const accountTypeLabels: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  CREDIT_CARD: "Cartão de Crédito",
  INVESTMENT: "Investimentos",
};

export function AccountList({ accounts, isLoading = false }: AccountListProps) {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch("/api/v1/of/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync account");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Conta sincronizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao sincronizar conta");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/v1/of/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect account");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Conta desconectada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desconectar conta");
    },
  });

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Nunca sincronizado";

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    return `Há ${diffDays} dias`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-secondary";
      case "ERROR":
        return "text-error";
      case "EXPIRED":
        return "text-chart-1";
      default:
        return "text-on-surface-variant";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Ativa";
      case "ERROR":
        return "Erro";
      case "EXPIRED":
        return "Expirada";
      case "DISCONNECTED":
        return "Desconectada";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contas Conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas Conectadas</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">
            Nenhuma conta conectada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="border border-outline/20 rounded-lg p-4 hover:bg-surface-variant/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Institution Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>

                    {/* Account Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-on-surface truncate">
                          {account.institutionName}
                        </h3>
                        <span
                          className={`text-xs font-medium ${getStatusColor(account.status)}`}
                        >
                          {getStatusLabel(account.status)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-2">
                        {accountTypeLabels[account.accountType] ||
                          account.accountType}
                        {account.accountNumber && ` • ${account.accountNumber}`}
                      </p>
                      <p className="text-lg font-bold text-on-surface">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Última sincronização: {formatLastSync(account.lastSync)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate(account.connectionId)}
                      disabled={
                        syncMutation.isPending ||
                        account.status === "DISCONNECTED"
                      }
                      className="w-full"
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Sincronizar
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        disconnectMutation.mutate(account.connectionId)
                      }
                      disabled={
                        disconnectMutation.isPending ||
                        account.status === "DISCONNECTED"
                      }
                      className="w-full text-error hover:text-error"
                    >
                      {disconnectMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Unplug className="w-4 h-4 mr-1" />
                          Desconectar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
