import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  className = '', 
  onClick 
}) => {
  const baseClasses = 'bg-surface-new-primary rounded-lg transition-smooth-200';
  
  const variantClasses = {
    default: 'border border-border-primary',
    elevated: 'shadow-soft-md',
    flat: '',
    interactive: 'shadow-soft-md cursor-pointer hover:shadow-soft-lg hover:-translate-y-0.5',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // If onClick is provided but variant is not interactive, treat as interactive
  const effectiveVariant = onClick && variant === 'default' ? 'interactive' : variant;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[effectiveVariant]} ${paddingClasses[padding]} ${className}`} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
export { Card };
