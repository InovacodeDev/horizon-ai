import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/assets/Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  label?: string;
}

const Input: React.FC<InputProps> = ({ leftIcon, label, id, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordInput = type === 'password';
  const inputType = isPasswordInput && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={inputType}
          className={`w-full h-12 ${leftIcon ? 'pl-10' : 'pl-4'} ${isPasswordInput ? 'pr-12' : 'pr-4'} bg-surface border border-outline rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors duration-200`}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
