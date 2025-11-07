import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div 
      className={`bg-border-secondary animate-pulse rounded-md ${className}`}
      role="status"
      aria-label="Loading content"
    />
  );
};

export default Skeleton;
