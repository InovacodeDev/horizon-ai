import { useCallback, useState } from 'react';

/**
 * Hook for currency input with automatic formatting
 *
 * The mask works from the second decimal place onwards:
 * - Initial: R$ 0,00
 * - Type "7": R$ 0,07
 * - Type "3": R$ 0,73
 * - Type "0": R$ 7,30
 * - Type "5": R$ 73,05
 *
 * @param initialValue - Initial value in cents (e.g., 4990 for R$ 49,90)
 * @returns Object with formatted value, raw value in cents, and change handler
 */
export function useCurrencyInput(initialValue: number = 0) {
  const [valueInCents, setValueInCents] = useState<number>(initialValue);

  /**
   * Format cents to BRL currency string
   * @param cents - Value in cents (e.g., 4990 for R$ 49,90)
   * @returns Formatted string (e.g., "R$ 49,90")
   */
  const formatCents = useCallback((cents: number): string => {
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;

    // Format reais with thousand separators
    const formattedReais = reais.toLocaleString('pt-BR');

    // Ensure centavos always has 2 digits
    const formattedCentavos = centavos.toString().padStart(2, '0');

    return `R$ ${formattedReais},${formattedCentavos}`;
  }, []);

  /**
   * Get the formatted display value
   */
  const displayValue = formatCents(valueInCents);

  /**
   * Get the numeric value (for API calls)
   */
  const numericValue = valueInCents / 100;

  /**
   * Handle input change
   * Only accepts numeric input and formats automatically
   */
  const handleChange = useCallback((value: string) => {
    // Remove all non-numeric characters
    const numbersOnly = value.replace(/\D/g, '');

    // Convert to number (this is the value in cents)
    const cents = parseInt(numbersOnly || '0', 10);

    // Limit to reasonable values (max 999,999,999.99)
    const maxCents = 99999999999; // R$ 999,999,999.99
    const limitedCents = Math.min(cents, maxCents);

    setValueInCents(limitedCents);
  }, []);

  /**
   * Reset to initial value or zero
   */
  const reset = useCallback((value: number = 0) => {
    setValueInCents(value);
  }, []);

  /**
   * Set value from numeric input (in reais)
   */
  const setValue = useCallback((reais: number) => {
    const cents = Math.round(reais * 100);
    setValueInCents(cents);
  }, []);

  return {
    displayValue,
    numericValue,
    valueInCents,
    handleChange,
    reset,
    setValue,
  };
}
