import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const isClickable = !!onClick;
  const classes = `bg-surface-container rounded-xl border border-outline shadow-sm transition-shadow duration-300 ${isClickable ? 'cursor-pointer hover:shadow-md' : ''} ${className}`;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
export { Card };
