'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface PricePoint {
  date: string;
  price: number;
  merchant: string;
  merchantCnpj: string;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
  productName: string;
}

// Generate distinct colors for different merchants
const MERCHANT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export default function PriceHistoryChart({ data, productName }: PriceHistoryChartProps) {
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

  // Format date for axis (shorter)
  const formatAxisDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  };

  // Group data by merchant
  const merchantMap = new Map<string, PricePoint[]>();
  data.forEach((point) => {
    if (!merchantMap.has(point.merchant)) {
      merchantMap.set(point.merchant, []);
    }
    merchantMap.get(point.merchant)!.push(point);
  });

  // Get unique merchants
  const merchants = Array.from(merchantMap.keys());

  // Transform data for recharts - create a unified dataset with all dates
  const allDates = Array.from(new Set(data.map((p) => p.date))).sort();
  
  const chartData = allDates.map((date) => {
    const dataPoint: any = { date };
    
    merchants.forEach((merchant) => {
      const merchantData = merchantMap.get(merchant) || [];
      const pricePoint = merchantData.find((p) => p.date === date);
      if (pricePoint) {
        dataPoint[merchant] = pricePoint.price;
      }
    });
    
    return dataPoint;
  });

  // Calculate min and max prices for reference lines
  const allPrices = data.map((p) => p.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const avgPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;

  // Find which merchant has the lowest and highest prices
  const lowestPricePoint = data.find((p) => p.price === minPrice);
  const highestPricePoint = data.find((p) => p.price === maxPrice);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
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
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-sm">Nenhum histórico de preços disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Menor Preço</p>
          <p className="text-lg font-semibold text-green-900">{formatCurrency(minPrice)}</p>
          {lowestPricePoint && (
            <p className="text-xs text-green-600 mt-1">{lowestPricePoint.merchant}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Preço Médio</p>
          <p className="text-lg font-semibold text-blue-900">{formatCurrency(avgPrice)}</p>
          <p className="text-xs text-blue-600 mt-1">{data.length} compras</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 font-medium mb-1">Maior Preço</p>
          <p className="text-lg font-semibold text-red-900">{formatCurrency(maxPrice)}</p>
          {highestPricePoint && (
            <p className="text-xs text-red-600 mt-1">{highestPricePoint.merchant}</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Histórico de Preços - {productName}
        </h3>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis
              dataKey="date"
              tickFormatter={formatAxisDate}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* Reference line for lowest price */}
            <ReferenceLine
              y={minPrice}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{
                value: `Menor: ${formatCurrency(minPrice)}`,
                position: 'right',
                fill: '#10b981',
                fontSize: 11,
              }}
            />

            {/* Reference line for highest price */}
            <ReferenceLine
              y={maxPrice}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                value: `Maior: ${formatCurrency(maxPrice)}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 11,
              }}
            />

            {/* Lines for each merchant */}
            {merchants.map((merchant, index) => (
              <Line
                key={merchant}
                type="monotone"
                dataKey={merchant}
                name={merchant}
                stroke={MERCHANT_COLORS[index % MERCHANT_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: MERCHANT_COLORS[index % MERCHANT_COLORS.length], r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Merchant Legend with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {merchants.map((merchant, index) => {
          const merchantData = merchantMap.get(merchant) || [];
          const merchantPrices = merchantData.map((p) => p.price);
          const merchantAvg = merchantPrices.reduce((sum, p) => sum + p, 0) / merchantPrices.length;
          const merchantMin = Math.min(...merchantPrices);
          const merchantMax = Math.max(...merchantPrices);

          return (
            <div
              key={merchant}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div
                className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                style={{ backgroundColor: MERCHANT_COLORS[index % MERCHANT_COLORS.length] }}
              />
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{merchant}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span>Média: {formatCurrency(merchantAvg)}</span>
                  <span>•</span>
                  <span>{merchantData.length} compras</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="text-green-600">↓ {formatCurrency(merchantMin)}</span>
                  <span>•</span>
                  <span className="text-red-600">↑ {formatCurrency(merchantMax)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
