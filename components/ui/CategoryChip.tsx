import React from 'react';

import { InvoiceCategory } from '@/lib/services/nfe-crawler/types';

export type CategoryType = InvoiceCategory | string;

interface CategoryChipProps {
  category: CategoryType;
  className?: string;
}

const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  [InvoiceCategory.PHARMACY]: {
    label: 'Farmácia',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  [InvoiceCategory.GROCERIES]: {
    label: 'Hortifruti',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  [InvoiceCategory.SUPERMARKET]: {
    label: 'Supermercado',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  [InvoiceCategory.RESTAURANT]: {
    label: 'Restaurante',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  [InvoiceCategory.FUEL]: {
    label: 'Combustível',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  [InvoiceCategory.RETAIL]: {
    label: 'Varejo',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  [InvoiceCategory.SERVICES]: {
    label: 'Serviços',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  [InvoiceCategory.HOME]: {
    label: 'Casa e Decoração',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  [InvoiceCategory.ELECTRONICS]: {
    label: 'Eletrônicos',
    color: 'text-zinc-700 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-900/30',
  },
  [InvoiceCategory.CLOTHING]: {
    label: 'Vestuário',
    color: 'text-pink-700 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  [InvoiceCategory.ENTERTAINMENT]: {
    label: 'Entretenimento',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  [InvoiceCategory.TRANSPORT]: {
    label: 'Transporte',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  [InvoiceCategory.HEALTH]: {
    label: 'Saúde',
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  [InvoiceCategory.EDUCATION]: {
    label: 'Educação',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
  },
  [InvoiceCategory.PETS]: {
    label: 'Pets',
    color: 'text-lime-700 dark:text-lime-400',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
  },
  [InvoiceCategory.OTHER]: {
    label: 'Outro',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
};

export function CategoryChip({ category, className = '' }: CategoryChipProps) {
  const config = categoryConfig[category] || categoryConfig.other;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}

export function getCategoryLabel(category: CategoryType): string {
  return categoryConfig[category]?.label || categoryConfig.other.label;
}
