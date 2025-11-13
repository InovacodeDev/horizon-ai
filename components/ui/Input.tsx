import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/assets/Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ 
  leftIcon, 
  rightIcon,
  label, 
  error,
  helperText,
  id, 
  type, 
  disabled,
  className = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordInput = type === 'password';
  const inputType = isPasswordInput && showPassword ? 'text' : type;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-text-primary mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          disabled={disabled}
          className={`
            w-full h-12 px-4 
            ${leftIcon ? 'pl-11' : ''} 
            ${isPasswordInput || rightIcon ? 'pr-12' : ''} 
            bg-surface-new-primary 
            border ${hasError ? 'border-red-border' : 'border-border-primary'}
            rounded-lg 
            text-sm text-text-primary
            placeholder:text-text-tertiary
            transition-colors-smooth
            focus:outline-none 
            focus:border-border-focus 
            focus:ring-2 
            focus:ring-border-focus
            disabled:opacity-60 
            disabled:cursor-not-allowed
            disabled:bg-bg-secondary
            ${className}
          `}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
        {!isPasswordInput && rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-text">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
export { Input };
