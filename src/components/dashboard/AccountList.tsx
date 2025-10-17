"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, ListItem } from "@/components/ui/list";
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

        // Handle rate limit error with custom message
        if (response.status === 429) {
          throw new Error(error.message || "Aguarde antes de sincronizar novamente");
        }

        throw new Error(error.error || "Failed to sync account");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      // Show detailed success message
      const message =
        data.transactionsAdded > 0
          ? `${data.transactionsAdded} nova(s) transação(ões) sincronizada(s)!`
          : "Conta sincronizada! Nenhuma transação nova.";

      toast.success(message);
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
        return "text-[hsl(var(--md-sys-color-secondary))]";
      case "ERROR":
        return "text-[hsl(var(--md-sys-color-error))]";
      case "EXPIRED":
        return "text-[hsl(var(--md-sys-color-tertiary))]";
      default:
        return "text-[hsl(var(--md-sys-color-on-surface-variant))]";
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
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Contas Conectadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-[hsl(var(--md-sys-color-primary))] animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Contas Conectadas</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] text-[hsl(var(--md-sys-color-on-surface-variant))] text-center py-8">
            Nenhuma conta conectada ainda.
          </p>
        ) : (
          <List>
            {accounts.map((account) => (
              <ListItem
                key={account.id}
                leading={
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--md-sys-color-primary)/0.1)] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[hsl(var(--md-sys-color-primary))]" />
                  </div>
                }
                overline={`${accountTypeLabels[account.accountType] || account.accountType}${account.accountNumber ? ` • ${account.accountNumber}` : ""}`}
                headline={account.institutionName}
                supportingText={`${formatCurrency(account.balance, account.currency)} • ${getStatusLabel(account.status)} • ${formatLastSync(account.lastSync)}`}
                trailing={
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        syncMutation.mutate(account.connectionId);
                      }}
                      disabled={syncMutation.isPending || account.status === "DISCONNECTED"}
                      className="w-full min-w-[120px]"
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
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        disconnectMutation.mutate(account.connectionId);
                      }}
                      disabled={disconnectMutation.isPending || account.status === "DISCONNECTED"}
                      className="w-full min-w-[120px] text-[hsl(var(--md-sys-color-error))] hover:text-[hsl(var(--md-sys-color-error))]"
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
                }
              />
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
