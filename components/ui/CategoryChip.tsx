import React from 'react';

export type CategoryType = 
  | 'pharmacy' 
  | 'groceries' 
  | 'supermarket' 
  | 'restaurant' 
  | 'fuel' 
  | 'retail' 
  | 'services' 
  | 'other';

interface CategoryChipProps {
  category: CategoryType;
  className?: string;
}

const categoryConfig: Record<CategoryType, { label: string; color: string; bgColor: string }> = {
  pharmacy: {
    label: 'Farmácia',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  groceries: {
    label: 'Hortifruti',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  supermarket: {
    label: 'Supermercado',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  restaurant: {
    label: 'Restaurante',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  fuel: {
    label: 'Combustível',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  retail: {
    label: 'Varejo',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  services: {
    label: 'Serviços',
    color: 'text-indigo-700 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  other: {
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
