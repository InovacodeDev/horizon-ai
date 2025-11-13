import React, { useState, useEffect } from 'react';

interface DateInputProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  id,
  value,
  onChange,
  required = false,
  placeholder = 'DD/MM/AAAA',
  className = '',
  disabled = false,
  min,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const formatToDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Format date from DD/MM/YYYY to YYYY-MM-DD
  const formatToISO = (displayDate: string): string => {
    const cleaned = displayDate.replace(/\D/g, '');
    if (cleaned.length !== 8) return '';

    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);

    // Validate date
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (
      date.getFullYear() !== parseInt(year) ||
      date.getMonth() !== parseInt(month) - 1 ||
      date.getDate() !== parseInt(day)
    ) {
      return '';
    }

    return `${year}-${month}-${day}`;
  };

  // Apply mask DD/MM/YYYY
  const applyMask = (input: string): string => {
    const cleaned = input.replace(/\D/g, '');
    let masked = '';

    for (let i = 0; i < cleaned.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        masked += '/';
      }
      masked += cleaned[i];
    }

    return masked;
  };

  // Initialize display value
  useEffect(() => {
    if (value) {
      setDisplayValue(formatToDisplay(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow empty input
    if (input === '') {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Apply mask
    const masked = applyMask(input);
    setDisplayValue(masked);

    // Convert to ISO format if complete
    if (masked.length === 10) {
      const isoDate = formatToISO(masked);
      if (isoDate) {
        onChange(isoDate);
      }
    }
  };

  const handleBlur = () => {
    // Validate on blur
    if (displayValue && displayValue.length === 10) {
      const isoDate = formatToISO(displayValue);
      if (!isoDate) {
        setDisplayValue('');
        onChange('');
      }
    } else if (displayValue && displayValue.length < 10) {
      setDisplayValue('');
      onChange('');
    }
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className='block text-sm font-medium text-text-secondary mb-2'
        >
          {label}
          {required && <span className='text-red-text ml-1'>*</span>}
        </label>
      )}
      <input
        type='text'
        id={id}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        className='w-full h-12 px-4 bg-surface-new-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-border-focus focus:border-border-focus focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
      />
    </div>
  );
};

export default DateInput;
