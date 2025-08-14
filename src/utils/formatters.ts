import { safeArrayAccess, safeArrayFirst } from './typeGuards';

// Function to truncate TXIDs for display
export const truncateTxid = (txid: string, length: number = 8): string => {
  if (!txid) return '';
  if (txid.length <= length * 2 + 3) return txid;
  return `${txid.substring(0, length)}...${txid.substring(txid.length - length)}`;
};

// Function to format large number strings with commas
export function formatNumberString(
  numStr: string | undefined | null,
  defaultDisplay = 'N/A',
): string {
  if (numStr === undefined || numStr === null || numStr === '') {
    return defaultDisplay;
  }

  try {
    // Remove any existing commas and validate the string contains only digits
    // and an optional decimal part. This avoids precision issues with
    // `parseFloat` on very large numbers.
    const cleaned = String(numStr).replace(/,/g, '');
    const isNegative = cleaned.startsWith('-');
    const numericPart = isNegative ? cleaned.slice(1) : cleaned;
    if (!/^\d+(\.\d+)?$/.test(numericPart)) return defaultDisplay;

    const parts = numericPart.split('.');
    const intPart = safeArrayFirst(parts);
    if (!intPart) return defaultDisplay;
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decPart = safeArrayAccess(parts, 1);
    const result = decPart ? `${withCommas}.${decPart}` : withCommas;
    return isNegative ? `-${result}` : result;
  } catch {
    return defaultDisplay;
  }
}

export function formatNumber(value: number): string {
  if (value === 0) return '0';
  const str = value.toString();
  const parts = str.split('.');
  const intPart = safeArrayFirst(parts);
  if (!intPart) return '0';

  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = safeArrayAccess(parts, 1);
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

/**
 * Converts satoshis to BTC with consistent formatting
 *
 * @param sats - Amount in satoshis
 * @returns Formatted BTC amount as string with 8 decimal places
 */
export function formatSatsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}

/**
 * Formats a USD value with currency formatting
 *
 * @param value - USD value to format
 * @returns Formatted USD string
 */
export function formatUsd(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number with commas and specified decimal places
 *
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumberWithLocale(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString(undefined, options);
}

/**
 * Truncates an address for display
 *
 * @param address - Address string to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address string
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4,
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

/**
 * Formats a date to locale string for consistent display
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString([], options);
}

/**
 * Formats a time to locale string for consistent display
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString([], options);
}

/**
 * Formats a date and time to locale string for consistent display
 *
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleString(undefined, options);
}
