"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface Transaction {
  id: string;
  type: "DEBIT" | "CREDIT";
  amount: number;
  description: string;
  category: string | null;
  date: string;
  accountName: string;
  accountType: string;
  institutionName: string;
}

interface TransactionFeedProps {
  initialData?: {
    data: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}

async function fetchTransactions({ pageParam = 1 }) {
  const response = await fetch(`/api/v1/dashboard?page=${pageParam}&limit=30`);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const data = await response.json();
  return data.transactions;
}

export function TransactionFeed({ initialData }: TransactionFeedProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined;
    },
  });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
      }).format(date);
    }
  };

  // Deduplicate credit card payments
  const deduplicateTransactions = (transactions: Transaction[]) => {
    const seen = new Map<string, Transaction>();

    for (const transaction of transactions) {
      // Create a key based on amount, date, and description
      const key = `${transaction.amount}_${transaction.date}_${transaction.description.toLowerCase().trim()}`;

      // If we've seen this transaction before, keep the credit card one
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        // Prefer CREDIT_CARD type over CHECKING for deduplication
        if (
          transaction.accountType === "CREDIT_CARD" &&
          existing.accountType !== "CREDIT_CARD"
        ) {
          seen.set(key, transaction);
        }
      } else {
        seen.set(key, transaction);
      }
    }

    return Array.from(seen.values());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-error text-center py-8">
            Erro ao carregar transações. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allTransactions = data?.pages.flatMap((page) => page.data) || [];
  const deduplicatedTransactions = deduplicateTransactions(allTransactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {deduplicatedTransactions.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-8">
            Nenhuma transação encontrada nos últimos 30 dias.
          </p>
        ) : (
          <div className="space-y-1">
            {deduplicatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3 px-2 hover:bg-surface-variant/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Transaction Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === "CREDIT"
                        ? "bg-secondary/10"
                        : "bg-error/10"
                    }`}
                  >
                    {transaction.type === "CREDIT" ? (
                      <ArrowDownRight className="w-5 h-5 text-secondary" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-error" />
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-on-surface-variant">
                        {transaction.institutionName}
                      </p>
                      {transaction.category && (
                        <>
                          <span className="text-xs text-on-surface-variant">
                            •
                          </span>
                          <p className="text-xs text-on-surface-variant">
                            {transaction.category}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount and Date */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === "CREDIT"
                          ? "text-secondary"
                          : "text-on-surface"
                      }`}
                    >
                      {transaction.type === "CREDIT" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="py-4">
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Load more button (fallback) */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
