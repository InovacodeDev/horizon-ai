import React from 'react';

const Spinner: React.FC<{className?: string}> = ({className}) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-primary border-primary/20 h-12 w-12 ${className}`}
      role="status"
    >
        <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default Spinner;
export { Spinner };
