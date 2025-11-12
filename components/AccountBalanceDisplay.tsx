'use client';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import Skeleton from '@/components/ui/Skeleton';

interface AccountBalanceDisplayProps {
  /**
   * The account ID to display balance for
   */
  accountId: string;
  /**
   * Optional account name to display
   */
  accountName?: string;
  /**
   * Whether to show the account name
   * @default false
   */
  showName?: boolean;
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Callback when balance updates
   */
  onBalanceUpdate?: (balance: number) => void;
}

/**
 * Component that displays an account balance with automatic realtime updates
 *
 * This component uses the useAccountBalance hook to subscribe to balance changes
 * and automatically updates when the balance changes via Appwrite Functions.
 *
 * @example
 * ```tsx
 * <AccountBalanceDisplay
 *   accountId="account-123"
 *   accountName="Checking Account"
 *   showName
 *   size="lg"
 * />
 * ```
 */
export function AccountBalanceDisplay({
  accountId,
  accountName,
  showName = false,
  size = 'md',
  className = '',
  onBalanceUpdate,
}: AccountBalanceDisplayProps) {
  const { balance, loading, error } = useAccountBalance(accountId, {
    onBalanceUpdate,
    onError: (err) => console.error('Balance update error:', err),
  });

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const nameSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (loading) {
    return (
      <div className={className}>
        {showName && accountName && (
          <Skeleton className={`h-4 w-32 mb-1 ${nameSizeClasses[size]}`} />
        )}
        <Skeleton className={`h-6 w-40 ${sizeClasses[size]}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-error ${className}`}>
        {showName && accountName && (
          <p className={`font-medium ${nameSizeClasses[size]}`}>{accountName}</p>
        )}
        <p className={sizeClasses[size]}>Error loading balance</p>
      </div>
    );
  }

  const formattedBalance =
    balance !== null
      ? balance.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      : '—';

  return (
    <div className={className}>
      {showName && accountName && (
        <p className={`text-on-surface-variant font-medium ${nameSizeClasses[size]}`}>{accountName}</p>
      )}
      <p className={`font-semibold text-on-surface ${sizeClasses[size]}`}>{formattedBalance}</p>
    </div>
  );
}
