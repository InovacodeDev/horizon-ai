import { snackbar } from "@/components/ui/snackbar";

/**
 * Show a success toast notification using MD3 Snackbar
 *
 * @param message - The success message to display
 * @param options - Optional configuration for the snackbar
 *
 * @example
 * showSuccessToast('Itaú account connected successfully!');
 *
 * @example
 * showSuccessToast('Account connected', {
 *   action: {
 *     label: 'View',
 *     onClick: () => console.log('View clicked')
 *   }
 * });
 */
export function showSuccessToast(
  message: string,
  options?: {
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }
) {
  snackbar.success(message, {
    duration: options?.duration ?? 3000,
    action: options?.action,
  });
}
