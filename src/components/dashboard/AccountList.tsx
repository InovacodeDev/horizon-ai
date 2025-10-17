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
      <Card variant="elevated">
        <CardHeader>
          {/* MD3 Headline Small Typography */}
          <CardTitle className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
            Contas Conectadas
          </CardTitle>
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
        {/* MD3 Headline Small Typography */}
        <CardTitle className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
          Contas Conectadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] text-center py-8">
            Nenhuma conta conectada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="border border-[hsl(var(--md-sys-color-outline))]/20 rounded-lg p-4 hover:bg-[hsl(var(--md-sys-color-surface-variant))]/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Institution Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[hsl(var(--md-sys-color-primary))]/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[hsl(var(--md-sys-color-primary))]" />
                    </div>

                    {/* Account Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* MD3 Title Small Typography */}
                        <h3 className="font-[family-name:var(--md-sys-typescale-title-small-font)] text-[length:var(--md-sys-typescale-title-small-size)] leading-[var(--md-sys-typescale-title-small-line-height)] font-[number:var(--md-sys-typescale-title-small-weight)] tracking-[var(--md-sys-typescale-title-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))] truncate">
                          {account.institutionName}
                        </h3>
                        {/* MD3 Label Small Typography */}
                        <span
                          className={`font-[family-name:var(--md-sys-typescale-label-small-font)] text-[length:var(--md-sys-typescale-label-small-size)] leading-[var(--md-sys-typescale-label-small-line-height)] font-[number:var(--md-sys-typescale-label-small-weight)] tracking-[var(--md-sys-typescale-label-small-tracking)] ${getStatusColor(account.status)}`}
                        >
                          {getStatusLabel(account.status)}
                        </span>
                      </div>
                      {/* MD3 Body Small Typography */}
                      <p className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] mb-2">
                        {accountTypeLabels[account.accountType] || account.accountType}
                        {account.accountNumber && ` • ${account.accountNumber}`}
                      </p>
                      {/* MD3 Display Small Typography */}
                      <p className="font-[family-name:var(--md-sys-typescale-display-small-font)] text-[length:var(--md-sys-typescale-display-small-size)] leading-[var(--md-sys-typescale-display-small-line-height)] font-[number:var(--md-sys-typescale-display-small-weight)] tracking-[var(--md-sys-typescale-display-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                      {/* MD3 Label Small Typography */}
                      <p className="font-[family-name:var(--md-sys-typescale-label-small-font)] text-[length:var(--md-sys-typescale-label-small-size)] leading-[var(--md-sys-typescale-label-small-line-height)] font-[number:var(--md-sys-typescale-label-small-weight)] tracking-[var(--md-sys-typescale-label-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] mt-1">
                        Última sincronização: {formatLastSync(account.lastSync)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => syncMutation.mutate(account.connectionId)}
                      disabled={syncMutation.isPending || account.status === "DISCONNECTED"}
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
                      variant="outlined"
                      size="small"
                      onClick={() => disconnectMutation.mutate(account.connectionId)}
                      disabled={disconnectMutation.isPending || account.status === "DISCONNECTED"}
                      className="w-full text-[hsl(var(--md-sys-color-error))]"
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
