'use client';

import { ProjectionData } from '@/hooks/use-projection';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BurnRateChartProps {
  data: ProjectionData[];
}

export function BurnRateChart({ data }: BurnRateChartProps) {
  // Process data for the chart
  const chartData = data.map((d) => {
    const realized = d.items
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const projectedCommitted = d.items
      .filter((i) => i.status === 'PROJECTED' && i.isRecurring)
      .reduce((sum, i) => sum + i.amount, 0);

    // We might also want projected variable? The user didn't ask for it in the chart bars, 
    // but usually you want to see total projected.
    // The user spec: "Bars: 1. Realized, 2. Committed".
    // I will stick to that.

    return {
      name: d.monthLabel,
      realized,
      committed: projectedCommitted,
      income: d.totalIncome,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* Realized Bar - Solid Blue */}
          <Bar 
            dataKey="realized" 
            name="Realized" 
            stackId="a" 
            fill="#3b82f6" 
            radius={[0, 0, 4, 4]} 
          />
          
          {/* Committed Bar - Light Blue / Opacity */}
          <Bar 
            dataKey="committed" 
            name="Committed (Future)" 
            stackId="a" 
            fill="#93c5fd" 
            radius={[4, 4, 0, 0]} 
          />

          {/* Income Limit Line */}
          {chartData.length > 0 && (
             <ReferenceLine y={chartData[0].income} stroke="#10b981" strokeDasharray="3 3" label="Income Limit" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
