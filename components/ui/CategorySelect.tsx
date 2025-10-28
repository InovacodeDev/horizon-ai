import React from 'react';
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@/lib/constants/categories';

interface CategorySelectProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (categoryId: string) => void;
  required?: boolean;
  type?: 'expense' | 'income' | 'all';
  className?: string;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  label,
  id,
  value,
  onChange,
  required = false,
  type = 'all',
  className = '',
}) => {
  // Filter categories based on type
  const filteredCategories = React.useMemo(() => {
    if (type === 'all') {
      return TRANSACTION_CATEGORIES;
    }
    return TRANSACTION_CATEGORIES.filter((cat) => cat.type === type || cat.type === 'both');
  }, [type]);

  const selectedCategory = TRANSACTION_CATEGORIES.find((cat) => cat.id === value);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {selectedCategory && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <selectedCategory.icon className={`w-5 h-5 ${selectedCategory.color}`} />
          </div>
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full h-12 ${selectedCategory ? 'pl-12' : 'pl-3'} pr-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200 appearance-none cursor-pointer`}
        >
          <option value="">Selecione uma categoria</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-on-surface-variant"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CategorySelect;
