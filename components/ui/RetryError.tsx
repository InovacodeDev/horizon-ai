import { Button } from './Button';

interface RetryErrorProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
}

/**
 * Retry Error Component
 * Displays error message with retry option
 */
export function RetryError({
  error,
  onRetry,
  title = 'Algo deu errado',
  description,
  showDetails = false,
}: RetryErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 text-5xl">😕</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {description || 'Ocorreu um erro ao carregar este conteúdo.'}
        </p>
        
        {showDetails && errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-left dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * Displays when no data is available
 */
export function EmptyState({
  icon = '📭',
  title = 'No data available',
  description,
  action,
  actionLabel,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 text-5xl">{icon}</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {action && actionLabel && (
          <Button onClick={action} variant="primary">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
