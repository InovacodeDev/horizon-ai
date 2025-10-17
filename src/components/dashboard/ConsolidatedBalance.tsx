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
  CHECKING: "bg-primary",
  SAVINGS: "bg-secondary",
  CREDIT_CARD: "bg-chart-1",
  INVESTMENT: "bg-chart-2",
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
      <Card>
        <CardHeader>
          <CardTitle>Saldo Consolidado</CardTitle>
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
    <Card variant="elevated">
      <CardHeader>
        {/* MD3 Headline Small Typography */}
        <CardTitle className="font-[family-name:var(--md-sys-typescale-headline-small-font)] text-[length:var(--md-sys-typescale-headline-small-size)] leading-[var(--md-sys-typescale-headline-small-line-height)] font-[number:var(--md-sys-typescale-headline-small-weight)] tracking-[var(--md-sys-typescale-headline-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
          Saldo Consolidado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total Balance */}
        <div className="mb-6">
          {/* MD3 Body Medium Typography */}
          <p className="font-[family-name:var(--md-sys-typescale-body-medium-font)] text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] font-[number:var(--md-sys-typescale-body-medium-weight)] tracking-[var(--md-sys-typescale-body-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))] mb-2">
            Saldo Total
          </p>
          {/* MD3 Display Medium Typography */}
          <p className="font-[family-name:var(--md-sys-typescale-display-medium-font)] text-[length:var(--md-sys-typescale-display-medium-size)] leading-[var(--md-sys-typescale-display-medium-line-height)] font-[number:var(--md-sys-typescale-display-medium-weight)] tracking-[var(--md-sys-typescale-display-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Breakdown by Account Type */}
        {Object.keys(byType).length > 0 && (
          <div className="space-y-4">
            {/* MD3 Title Small Typography */}
            <p className="font-[family-name:var(--md-sys-typescale-title-small-font)] text-[length:var(--md-sys-typescale-title-small-size)] leading-[var(--md-sys-typescale-title-small-line-height)] font-[number:var(--md-sys-typescale-title-small-weight)] tracking-[var(--md-sys-typescale-title-small-tracking)] text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Por Tipo de Conta
            </p>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, balance]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${accountTypeColors[type] || "bg-[hsl(var(--md-sys-color-outline))]"}`}
                    />
                    {/* MD3 Body Small Typography */}
                    <span className="font-[family-name:var(--md-sys-typescale-body-small-font)] text-[length:var(--md-sys-typescale-body-small-size)] leading-[var(--md-sys-typescale-body-small-line-height)] font-[number:var(--md-sys-typescale-body-small-weight)] tracking-[var(--md-sys-typescale-body-small-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
                      {accountTypeLabels[type] || type}
                    </span>
                  </div>
                  {/* MD3 Label Medium Typography */}
                  <span className="font-[family-name:var(--md-sys-typescale-label-medium-font)] text-[length:var(--md-sys-typescale-label-medium-size)] leading-[var(--md-sys-typescale-label-medium-line-height)] font-[number:var(--md-sys-typescale-label-medium-weight)] tracking-[var(--md-sys-typescale-label-medium-tracking)] text-[hsl(var(--md-sys-color-on-surface))]">
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
