'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'text';
  leftIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'filled', leftIcon, className, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center h-[40px] px-6 rounded-full font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out';

  const variantClasses = {
    filled: 'bg-primary text-on-primary hover:shadow-md focus:ring-primary/50 disabled:bg-on-surface/12 disabled:text-on-surface/38',
    outlined: 'border border-outline text-primary hover:bg-primary/5 focus:ring-primary/50 disabled:border-on-surface/12 disabled:text-on-surface/38',
    text: 'text-primary hover:bg-primary/5 focus:ring-primary/50 disabled:text-on-surface/38',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
};

export default Button;
export { Button };
