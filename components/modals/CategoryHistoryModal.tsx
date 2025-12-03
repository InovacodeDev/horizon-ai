import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { XIcon, BrainCircuitIcon, TrendingUpIcon, CalendarIcon } from '@/components/assets/Icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CategoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    category: string;
    currentMonth: number;
    projectionNextMonth: number;
    projectionMonthAfter: number;
    reasoningNextMonth?: string;
    reasoningMonthAfter?: string;
    detectedPatterns?: string[];
    history: { month: string; amount: number }[];
  } | null;
}

const CategoryHistoryModal: React.FC<CategoryHistoryModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  // Prepare chart data
  const chartData = [
    ...data.history.map(h => ({
      name: h.month,
      amount: h.amount,
      type: 'history'
    })),
    {
      name: 'Próx. Mês',
      amount: data.projectionNextMonth,
      type: 'projection'
    },
    {
      name: 'Mês +2',
      amount: data.projectionMonthAfter,
      type: 'projection'
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {data.category}
              <span className="text-xs font-normal px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                Análise Inteligente
              </span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Histórico e projeção de gastos
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Chart Section */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize mt-1">
                            {item.type === 'history' ? 'Histórico Real' : 'Projeção IA'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'history' ? '#3B82F6' : '#10B981'} 
                      fillOpacity={entry.type === 'history' ? 1 : 0.7}
                      stroke={entry.type === 'projection' ? '#10B981' : 'none'}
                      strokeWidth={entry.type === 'projection' ? 2 : 0}
                      strokeDasharray={entry.type === 'projection' ? '4 4' : ''}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patterns */}
            <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BrainCircuitIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Padrões Detectados</h3>
                  {data.detectedPatterns && data.detectedPatterns.length > 0 ? (
                    <ul className="space-y-2">
                      {data.detectedPatterns.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum padrão específico detectado ainda.</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Projections Reasoning */}
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Análise de Projeção</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Próximo Mês</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {data.reasoningNextMonth || 'Projeção baseada na média histórica recente.'}
                      </p>
                    </div>
                    {data.reasoningMonthAfter && (
                      <div className="pt-2 border-t border-green-200 dark:border-green-800/30">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Mês Seguinte</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {data.reasoningMonthAfter}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryHistoryModal;
