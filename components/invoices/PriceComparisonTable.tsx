'use client';

import React, { useState, useMemo } from 'react';

interface MerchantPrice {
  merchantName: string;
  merchantCnpj: string;
  currentPrice: number;
  lastUpdated: string;
  priceChange: number;
  priceChangePercent: number;
}

interface PriceComparisonTableProps {
  productName: string;
  merchants: MerchantPrice[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  savingsPotential: number;
}

type SortField = 'merchant' | 'price' | 'date' | 'change';
type SortDirection = 'asc' | 'desc';

export default function PriceComparisonTable({
  productName,
  merchants,
  lowestPrice,
  highestPrice,
  averagePrice,
  savingsPotential,
}: PriceComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort merchants
  const sortedMerchants = useMemo(() => {
    const sorted = [...merchants];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'merchant':
          comparison = a.merchantName.localeCompare(b.merchantName);
          break;
        case 'price':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'date':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
        case 'change':
          comparison = a.priceChangePercent - b.priceChangePercent;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [merchants, sortField, sortDirection]);

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Empty state
  if (merchants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">Nenhuma comparação de preços disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Melhor Preço</p>
          <p className="text-lg font-semibold text-green-900">{formatCurrency(lowestPrice)}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Preço Médio</p>
          <p className="text-lg font-semibold text-blue-900">{formatCurrency(averagePrice)}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 font-medium mb-1">Maior Preço</p>
          <p className="text-lg font-semibold text-red-900">{formatCurrency(highestPrice)}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs text-purple-700 font-medium mb-1">Economia Potencial</p>
          <p className="text-lg font-semibold text-purple-900">{formatCurrency(savingsPotential)}</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('merchant')}
                >
                  <div className="flex items-center gap-2">
                    <span>Estabelecimento</span>
                    {getSortIcon('merchant')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2">
                    <span>Preço Atual</span>
                    {getSortIcon('price')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <span>Última Atualização</span>
                    {getSortIcon('date')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center gap-2">
                    <span>Variação</span>
                    {getSortIcon('change')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Economia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMerchants.map((merchant, index) => {
                const isBestPrice = merchant.currentPrice === lowestPrice;
                const savingsVsBest = merchant.currentPrice - lowestPrice;
                const savingsPercent = lowestPrice > 0 ? ((savingsVsBest / lowestPrice) * 100) : 0;

                return (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 transition-colors ${
                      isBestPrice ? 'bg-green-50' : ''
                    }`}
                  >
                    {/* Merchant Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isBestPrice && (
                          <svg
                            className="w-5 h-5 text-green-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {merchant.merchantName}
                          </p>
                          {isBestPrice && (
                            <p className="text-xs text-green-600 font-medium">Melhor Preço</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="px-4 py-3">
                      <p className={`text-sm font-semibold ${isBestPrice ? 'text-green-700' : 'text-gray-900'}`}>
                        {formatCurrency(merchant.currentPrice)}
                      </p>
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{formatRelativeDate(merchant.lastUpdated)}</p>
                      <p className="text-xs text-gray-500">{formatDate(merchant.lastUpdated)}</p>
                    </td>

                    {/* Price Change */}
                    <td className="px-4 py-3">
                      {merchant.priceChange !== 0 ? (
                        <div className="flex items-center gap-1">
                          {merchant.priceChange > 0 ? (
                            <>
                              <svg
                                className="w-4 h-4 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                              </svg>
                              <span className="text-sm font-medium text-red-600">
                                +{merchant.priceChangePercent.toFixed(1)}%
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                />
                              </svg>
                              <span className="text-sm font-medium text-green-600">
                                {merchant.priceChangePercent.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>

                    {/* Savings */}
                    <td className="px-4 py-3">
                      {isBestPrice ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Melhor opção
                        </span>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            +{formatCurrency(savingsVsBest)}
                          </p>
                          <p className="text-xs text-gray-500">
                            (+{savingsPercent.toFixed(1)}%)
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Savings Recommendation */}
      {savingsPotential > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Dica de Economia</h4>
              <p className="text-sm text-blue-800">
                Comprando no estabelecimento com melhor preço, você pode economizar até{' '}
                <span className="font-semibold">{formatCurrency(savingsPotential)}</span> em relação ao
                estabelecimento mais caro.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
