'use client';

import { useFormStatus } from 'react-dom';

/**
 * Helper hook that wraps React 19.2's useFormStatus
 * Provides convenient access to form submission state
 * 
 * Usage:
 * ```tsx
 * function SubmitButton() {
 *   const { pending, data, method } = useFormSubmit();
 *   return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
 * }
 * ```
 */
export function useFormSubmit() {
  const status = useFormStatus();
  
  return {
    pending: status.pending,
    data: status.data,
    method: status.method,
    action: status.action,
  };
}

/**
 * Component wrapper for submit buttons with loading state
 * Uses React 19.2's useFormStatus internally
 * 
 * Usage:
 * ```tsx
 * <form action={myAction}>
 *   <input name="email" />
 *   <SubmitButton>Sign In</SubmitButton>
 * </form>
 * ```
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  ...props
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  [key: string]: any;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      {...props}
    >
      {pending ? (pendingText || 'Loading...') : children}
    </button>
  );
}
