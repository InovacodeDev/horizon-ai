import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center rounded font-medium border';

  const variantClasses = {
    success: 'bg-green-bg text-green-text border-green-border',
    warning: 'bg-orange-bg text-orange-text border-orange-border',
    error: 'bg-red-bg text-red-text border-red-border',
    info: 'bg-blue-info-bg text-blue-info-text border-blue-info-border',
    neutral: 'bg-bg-secondary text-text-secondary border-border-primary',
  };

  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-xs',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
export { Badge };
