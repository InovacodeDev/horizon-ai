'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  monthsBack?: number;
}

interface MonthOption {
  value: string;
  label: string;
}

const DEFAULT_MONTHS_BACK = 18;

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  placeholder = 'Mês da compra',
  className = '',
  monthsBack = DEFAULT_MONTHS_BACK,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const monthOptions = useMemo(() => generateMonthOptions(monthsBack), [monthsBack]);
  const selectedLabel = value ? formatMonthLabel(value) : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2 border border-outline rounded-lg bg-surface text-sm text-on-surface hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className={value ? 'font-medium text-on-surface' : 'text-on-surface-variant'}>{selectedLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-outline bg-surface shadow-xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-outline/60 text-xs font-medium text-on-surface-variant">
            <span>Filtrar por mês</span>
            {value && (
              <button
                type="button"
                className="text-primary hover:text-primary-dark"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Limpar
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-outline/20">
            {monthOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-on-surface hover:bg-surface-variant/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function generateMonthOptions(monthsBack: number): MonthOption[] {
  const options: MonthOption[] = [];
  const current = new Date();

  for (let i = 0; i < monthsBack; i += 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({
      value,
      label: formatMonthLabel(value),
    });
  }

  return options;
}

function formatMonthLabel(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-').map((part) => parseInt(part, 10));
  if (Number.isNaN(year) || Number.isNaN(month)) return value;

  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

export default MonthPicker;
