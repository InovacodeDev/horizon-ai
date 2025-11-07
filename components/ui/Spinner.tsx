import React from 'react';

const Spinner: React.FC<{className?: string; size?: 'sm' | 'md' | 'lg'}> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full border-t-blue-primary border-blue-primary/20 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default Spinner;
export { Spinner };
