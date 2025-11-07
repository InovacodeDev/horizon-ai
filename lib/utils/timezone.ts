/**
 * Timezone utilities for handling dates consistently across the application
 *
 * IMPORTANT: Dates are stored in UTC by converting the user's local time to UTC.
 * When a user selects a date (e.g., 2025-11-01), it's treated as midnight in their
 * local timezone and converted to the equivalent UTC time.
 *
 * Example:
 * - User in São Paulo (UTC-3) selects: 2025-11-01
 * - Treated as: 2025-11-01 00:00:00 (GMT-3)
 * - Stored as: 2025-11-01T03:00:00.000Z (GMT 0)
 * - When displayed back, it shows correctly as 2025-11-01
 *
 * This ensures that dates are stored consistently and displayed correctly
 * regardless of the user's timezone.
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
 * Get the timezone offset in minutes for a given timezone
 * Positive offset means ahead of UTC, negative means behind UTC
 *
 * @param timezone - IANA timezone name (e.g., 'America/Sao_Paulo')
 * @param date - Date to get offset for (defaults to now)
 * @returns Offset in minutes (e.g., -180 for UTC-3)
 */
export function getTimezoneOffset(timezone?: string, date?: Date): number {
  const tz = timezone || getUserTimezone();
  const targetDate = date || new Date();

  // Get UTC time
  const utcDate = new Date(targetDate.toLocaleString('en-US', { timeZone: 'UTC' }));

  // Get time in target timezone
  const tzDate = new Date(targetDate.toLocaleString('en-US', { timeZone: tz }));

  // Calculate offset in minutes
  const offsetMs = tzDate.getTime() - utcDate.getTime();
  return Math.round(offsetMs / (1000 * 60));
}

/**
 * Convert a date string (YYYY-MM-DD) to ISO string in UTC, treating the input as local time
 * This ensures the date is stored correctly considering the user's timezone
 *
 * IMPORTANTE: Esta função converte a data local para UTC subtraindo o offset do timezone.
 * Por exemplo, se você está em UTC-3 e salva 01/11/2025 00:00:00, será salvo como
 * 01/11/2025 03:00:00 UTC (somando 3 horas porque -3 significa 3 horas atrás do UTC).
 *
 * @param dateString - Date in YYYY-MM-DD format (treated as local time at midnight)
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns ISO string in UTC
 *
 * @example
 * // User in São Paulo (UTC-3)
 * dateToUserTimezone('2025-11-01')
 * // Input: 2025-11-01 00:00:00 (GMT-3)
 * // Returns: '2025-11-01T03:00:00.000Z' (GMT 0)
 */
export function dateToUserTimezone(dateString: string, timezone?: string): string {
  const tz = timezone || getUserTimezone();

  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);

  // Create a Date object in local time (JavaScript's default behavior)
  // This treats the date as midnight in the system's local timezone
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Get the offset for the target timezone at this date
  // We need to create a date in the target timezone and compare with UTC
  const dateInTz = new Date(localDate.toLocaleString('en-US', { timeZone: tz }));
  const dateInUtc = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMs = dateInTz.getTime() - dateInUtc.getTime();

  // Subtract the offset to convert from target timezone to UTC
  // If we're in UTC-3, the offset will be negative, so subtracting it adds hours
  const utcTime = localDate.getTime() - offsetMs;
  const utcDate = new Date(utcTime);

  return utcDate.toISOString();
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
 * Get the current date and time in UTC, adjusted for the user's timezone
 *
 * Esta função retorna a data/hora atual em UTC, mas ajustada para o timezone do usuário.
 * Por exemplo, se você está em UTC-3 e são 10:00 local, retorna 13:00 UTC.
 *
 * @param timezone - User's timezone (optional, defaults to browser timezone)
 * @returns ISO string in UTC
 */
export function getCurrentDateTimeInUTC(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const now = new Date();

  // Get the timezone offset in minutes
  const offsetMinutes = getTimezoneOffset(tz, now);

  // Subtract the offset to get UTC time
  // If offset is -180 (UTC-3), we add 180 minutes (3 hours) to get UTC
  const utcTime = now.getTime() - offsetMinutes * 60 * 1000;
  const utcDate = new Date(utcTime);

  return utcDate.toISOString();
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
