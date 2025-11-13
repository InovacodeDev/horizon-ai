import React from 'react';
import Tooltip from './Tooltip';

export interface OwnershipBadgeProps {
  /**
   * Whether the data belongs to the current user
   */
  isOwn: boolean;
  
  /**
   * Name of the owner (for shared data)
   */
  ownerName?: string;
  
  /**
   * Owner ID for tooltip details
   */
  ownerId?: string;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Color scheme variant
   */
  variant?: 'default' | 'subtle' | 'outlined';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * OwnershipBadge Component
 * 
 * Displays ownership information for shared data items.
 * Shows "Sua" for own data or the owner's name for shared data.
 * Includes a tooltip with full owner information.
 * 
 * @example
 * ```tsx
 * // Own data
 * <OwnershipBadge isOwn={true} />
 * 
 * // Shared data
 * <OwnershipBadge 
 *   isOwn={false} 
 *   ownerName="João Silva" 
 *   ownerId="user123"
 * />
 * 
 * // With custom size and variant
 * <OwnershipBadge 
 *   isOwn={false} 
 *   ownerName="Maria Santos"
 *   size="sm"
 *   variant="outlined"
 * />
 * ```
 */
export const OwnershipBadge: React.FC<OwnershipBadgeProps> = ({
  isOwn,
  ownerName,
  ownerId,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  // Determine display text
  const displayText = isOwn ? 'Sua' : ownerName || 'Compartilhada';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  
  // Variant classes
  const variantClasses = {
    default: isOwn
      ? 'bg-blue-light text-blue-primary border border-blue-primary/20'
      : 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    subtle: isOwn
      ? 'bg-blue-light/50 text-blue-primary'
      : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    outlined: isOwn
      ? 'border border-blue-primary text-blue-primary bg-transparent'
      : 'border border-purple-300 text-purple-700 bg-transparent dark:border-purple-700 dark:text-purple-300',
  };
  
  // Tooltip content
  const tooltipContent = isOwn
    ? 'Esta é sua conta/transação'
    : `Compartilhada por ${ownerName || 'outro usuário'}${ownerId ? ` (ID: ${ownerId.substring(0, 8)}...)` : ''}`;
  
  const badgeElement = (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-lg
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {/* Icon indicator */}
      {isOwn ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      )}
      {displayText}
    </span>
  );
  
  // Wrap with tooltip
  return (
    <Tooltip content={tooltipContent}>
      {badgeElement}
    </Tooltip>
  );
};

export default OwnershipBadge;
