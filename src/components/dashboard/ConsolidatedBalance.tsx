"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ConsolidatedBalanceProps {
  total: number;
  currency: string;
  byType: Record<string, number>;
  isLoading?: boolean;
}

const accountTypeLabels: Record<string, string> = {
  CHECKING: "Conta Corrente",
  SAVINGS: "Poupança",
  CREDIT_CARD: "Cartão de Crédito",
  INVESTMENT: "Investimentos",
};

const accountTypeColors: Record<string, string> = {
  CHECKING: "bg-[hsl(var(--md-sys-color-primary))]",
  SAVINGS: "bg-[hsl(var(--md-sys-color-secondary))]",
  CREDIT_CARD: "bg-[hsl(var(--md-sys-color-tertiary))]",
  INVESTMENT: "bg-[hsl(var(--md-sys-color-error))]",
};

export function ConsolidatedBalance({ total, currency, byType, isLoading = false }: ConsolidatedBalanceProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Saldo Consolidado</CardTitle>
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
        <CardTitle>Saldo Consolidado</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total Balance */}
        <div className="mb-6">
          <p className="text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] text-[hsl(var(--md-sys-color-on-surface-variant))] mb-2">
            Saldo Total
          </p>
          <p className="text-[length:var(--md-sys-typescale-display-small-size)] leading-[var(--md-sys-typescale-display-small-line-height)] font-[var(--md-sys-typescale-display-small-weight)] text-[hsl(var(--md-sys-color-on-surface))]">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Breakdown by Account Type */}
        {Object.keys(byType).length > 0 && (
          <div className="space-y-4">
            <p className="text-[length:var(--md-sys-typescale-title-medium-size)] leading-[var(--md-sys-typescale-title-medium-line-height)] font-[var(--md-sys-typescale-title-medium-weight)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Por Tipo de Conta
            </p>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, balance]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${accountTypeColors[type] || "bg-[hsl(var(--md-sys-color-surface-variant))]"}`}
                    />
                    <span className="text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] text-[hsl(var(--md-sys-color-on-surface))]">
                      {accountTypeLabels[type] || type}
                    </span>
                  </div>
                  <span className="text-[length:var(--md-sys-typescale-body-large-size)] leading-[var(--md-sys-typescale-body-large-line-height)] font-medium text-[hsl(var(--md-sys-color-on-surface))]">
                    {formatCurrency(balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
