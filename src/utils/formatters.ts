import Big from 'big.js';

/**
 * Removes comma separators from number strings to prevent parsing errors
 * @param v - The number string to sanitize
 * @returns String with commas removed, or empty string if input is null/undefined
 * @example sanitizeNumberString('1,234.56') // '1234.56'
 */
export const sanitizeNumberString = (v: string | null | undefined): string =>
  v?.replace(/,/g, '') ?? '';

export const truncateTxid = (txid: string, length = 8): string => {
  if (!txid) return '';
  if (txid.length <= length * 2 + 3) return txid;
  return `${txid.substring(0, length)}...${txid.substring(txid.length - length)}`;
};

export function formatNumberString(
  numStr?: string | null,
  defaultDisplay = 'N/A',
): string {
  if (!numStr) return defaultDisplay;

  try {
    // Use our sanitizeNumberString utility to remove commas and handle null/undefined
    const cleaned = sanitizeNumberString(numStr);
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return defaultDisplay;
    const [intPart, decPart] = cleaned.split('.') as [string, string?];
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart ? `${withCommas}.${decPart}` : withCommas;
  } catch {
    return defaultDisplay;
  }
}

export function formatNumber(value: number): string {
  const [intPart, decPart] = value.toString().split('.') as [string, string?];
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withCommas}.${decPart}` : withCommas;
}

/**
 * Converts satoshis to BTC with consistent formatting
 *
 * @param sats - Amount in satoshis
 * @returns Formatted BTC amount as string with 8 decimal places
 */
export function formatSatsToBtc(sats: number | string | bigint): string {
  const s = typeof sats === 'bigint' ? sats.toString() : String(sats);
  // Round down to integer satoshis, then convert to BTC and format to 8 dp.
  return new Big(s).round(0, Big.roundDown).div(1e8).toFixed(8);
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
  startChars = 6,
  endChars = 4,
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
  return new Date(date).toLocaleDateString([], options);
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
  return new Date(date).toLocaleTimeString([], options);
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
  return new Date(date).toLocaleString(undefined, options);
}
