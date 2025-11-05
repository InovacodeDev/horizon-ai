/**
 * Timezone utilities for handling dates consistently across the application
 *
 * IMPORTANT: To avoid timezone shift issues (where dates appear as the previous day),
 * we store dates at noon UTC (12:00:00.000Z). This ensures that when displayed in any
 * timezone (-12 to +14 hours), the date will still be correct.
 *
 * Example:
 * - User selects: 2025-11-03
 * - Stored as: 2025-11-03T12:00:00.000Z
 * - Displayed in São Paulo (UTC-3): 2025-11-03 09:00 → shows as 03/11
 * - Displayed in Tokyo (UTC+9): 2025-11-03 21:00 → shows as 03/11
 *
 * Without this fix:
 * - Stored as: 2025-11-03T00:00:00.000Z
 * - Displayed in São Paulo (UTC-3): 2025-11-02 21:00 → shows as 02/11 ❌
 */

/**
 * Get the user's timezone from browser or default to America/Sao_Paulo
 */
export function getUserTimezone(): string {
  if (typeof window !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/Sao_Paulo';
    }
  }
  return 'America/Sao_Paulo';
}

/**
 * Convert a date string (YYYY-MM-DD) to ISO string preserving the date
 * This ensures the date is stored correctly without timezone shifts
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns ISO string representing noon UTC on that date
 *
 * @example
 * dateToUserTimezone('2025-11-03')
 * // Returns: '2025-11-03T12:00:00.000Z' (noon UTC prevents timezone shift issues)
 */
export function dateToUserTimezone(dateString: string, timezone?: string): string {
  // Store dates at noon UTC to prevent timezone conversion issues
  // This ensures that when displayed in any timezone (-12 to +14),
  // the date will still be correct
  return `${dateString}T12:00:00.000Z`;
}

/**
 * Convert an ISO string to a date string (YYYY-MM-DD) in user's timezone
 *
 * @param isoString - ISO date string
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns Date string in YYYY-MM-DD format
 *
 * @example
 * // User in São Paulo (UTC-3)
 * isoToUserTimezone('2025-10-29T03:00:00.000Z')
 * // Returns: '2025-10-29'
 */
export function isoToUserTimezone(isoString: string, timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const date = new Date(isoString);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Get the current date in user's timezone as YYYY-MM-DD
 *
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateInUserTimezone(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(now);
}

/**
 * Format a date for display in user's timezone
 *
 * @param isoString - ISO date string
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDateInUserTimezone(
  isoString: string,
  timezone?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const tz = timezone || getUserTimezone();
  const date = new Date(isoString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  const formatter = new Intl.DateTimeFormat('pt-BR', defaultOptions);
  return formatter.format(date);
}

/**
 * Add days to a date string in user's timezone
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns New date string in YYYY-MM-DD format
 */
export function addDaysInUserTimezone(dateString: string, days: number, timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const [year, month, day] = dateString.split('-').map(Number);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Get the start of month in user's timezone
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns ISO string representing start of month in user's timezone
 */
export function getStartOfMonthInUserTimezone(year: number, month: number, timezone?: string): string {
  return dateToUserTimezone(`${year}-${String(month).padStart(2, '0')}-01`, timezone);
}

/**
 * Get the end of month in user's timezone
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns ISO string representing end of month in user's timezone
 */
export function getEndOfMonthInUserTimezone(year: number, month: number, timezone?: string): string {
  const lastDay = new Date(year, month, 0).getDate();
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get the last moment of the day (23:59:59.999)
  const isoString = dateToUserTimezone(dateString, timezone);
  const date = new Date(isoString);
  date.setHours(23, 59, 59, 999);

  return date.toISOString();
}

/**
 * Check if two dates are the same day in user's timezone
 *
 * @param date1 - First date (ISO string or Date)
 * @param date2 - Second date (ISO string or Date)
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns True if dates are the same day
 */
export function isSameDayInUserTimezone(date1: string | Date, date2: string | Date, timezone?: string): boolean {
  const tz = timezone || getUserTimezone();

  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(d1) === formatter.format(d2);
}
