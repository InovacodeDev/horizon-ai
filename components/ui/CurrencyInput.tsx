import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  label?: string;
  id?: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  id,
  value,
  onChange,
  required = false,
  placeholder = 'R$ 0,00',
  className = '',
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format number to currency display
  const formatToCurrency = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse currency string to number
  const parseCurrency = (str: string): number => {
    // Remove all non-numeric characters except comma
    const cleaned = str.replace(/[^\d,]/g, '');
    // Replace comma with dot for parsing
    const normalized = cleaned.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Initialize display value
  useEffect(() => {
    if (value === 0 && displayValue === '') {
      return; // Don't format empty input
    }
    setDisplayValue(formatToCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow empty input
    if (input === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Remove all non-numeric characters
    const numericOnly = input.replace(/\D/g, '');

    if (numericOnly === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Convert to cents (last 2 digits are decimals)
    const cents = parseInt(numericOnly, 10);
    const valueInReais = cents / 100;

    // Update display with formatted value
    setDisplayValue(formatToCurrency(valueInReais));
    onChange(valueInReais);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all on focus for easy editing
    e.target.select();
  };

  const handleBlur = () => {
    // Ensure proper formatting on blur
    if (displayValue === '') {
      setDisplayValue(formatToCurrency(0));
      onChange(0);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          R$
        </span>
        <input
          type="text"
          id={id}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full h-12 pl-12 pr-3 bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
