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

export function ConsolidatedBalance({
  total,
  currency,
  byType,
  isLoading = false,
}: ConsolidatedBalanceProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>Saldo Consolidado</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total Balance */}
        <div className="mb-6">
          <p className="text-sm text-on-surface-variant mb-2">Saldo Total</p>
          <p className="text-4xl font-bold text-on-surface">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Breakdown by Account Type */}
        {Object.keys(byType).length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-on-surface-variant">
              Por Tipo de Conta
            </p>
            <div className="space-y-3">
              {Object.entries(byType).map(([type, balance]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${accountTypeColors[type] || "bg-muted"}`}
                    />
                    <span className="text-sm text-on-surface">
                      {accountTypeLabels[type] || type}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">
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
