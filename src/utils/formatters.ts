import Big from 'big.js';
// Removed dependency on @internationalized/number by normalizing via sanitizeForBig

/**
 * Sanitizes user input for Big.js constructor while preserving precision.
 * Pure string normalization: handles grouping, decimal separators, and exponent.
 */
export function sanitizeForBig(input: string | null | undefined): string {
  if (input == null) return '0';
  let s = String(input).trim();
  if (s === '') return '0';

  // Preserve a single leading minus; drop '+'
  let sign = '';
  if (s.startsWith('-')) {
    sign = '-';
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }

  // Remove common group separators: spaces (incl. NBSP, thin), underscores, apostrophes/quotes
  s = s.replace(/[\s\u00A0\u202F_]/g, '');
  s = s.replace(/[’'`]/g, '');

  // Normalize decimal separator: if both '.' and ',' occur, treat the last as decimal
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    s = s.split(thousandSep).join('');
    if (decimalSep === ',') s = s.replace(/,/g, '.');
  } else if (hasComma && !hasDot) {
    s = s.replace(/,/g, '.');
  }

  // Allow digits, dot, and exponent markers for now
  // Strip any remaining invalid characters
  s = s.replace(/[^0-9.eE+-]/g, '');

  // Collapse multiple dots in mantissa (keep first)
  // Split around exponent if present
  let mantissa = s;
  let exponent = '';
  const expMatch = s.match(/[eE][+-]?\d+$/);
  if (expMatch) {
    exponent = expMatch[0];
    mantissa = s.slice(0, s.length - exponent.length);
  }
  const firstDot = mantissa.indexOf('.');
  if (firstDot !== -1) {
    const intPart = mantissa.slice(0, firstDot).replace(/\./g, '');
    const fracPart = mantissa.slice(firstDot + 1).replace(/\./g, '');
    mantissa = intPart + (fracPart ? '.' + fracPart : '');
  }
  if (mantissa === '' || mantissa === '.') return '0';

  const candidate = sign + mantissa + exponent;

  // Validate with Big and return canonical fixed form to avoid exponential notation
  try {
    const b = new Big(candidate);
    return b.toFixed();
  } catch {
    return '0';
  }
}

/**
 * Parses a human-entered numeric string into a number consistently.
 * Uses sanitizeForBig under the hood to handle localized formats.
 */
export function parseAmount(input: string | null | undefined): number {
  const s = sanitizeForBig(input);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Truncates a transaction ID to a shorter format (e.g., "1234...5678").
 * @param txid - The transaction ID string.
 * @param length - Number of characters to keep at start and end (default: 8).
 * @returns Truncated transaction ID string.
 */
export const truncateTxid = (txid: string, length = 8): string => {
  if (!txid) return '';
  if (length <= 0) return txid;
  if (txid.length <= length * 2 + 3) return txid;
  return `${txid.substring(0, length)}...${txid.substring(txid.length - length)}`;
};

/**
 * Formats a numeric string for display, handling various input formats and locales.
 * @param numStr - The numeric string to format.
 * @param defaultDisplay - Fallback string if input is invalid (default: 'N/A').
 * @returns Formatted number string with commas.
 */
export function formatNumberString(
  numStr?: string | null,
  defaultDisplay = 'N/A',
): string {
  if (numStr == null) return defaultDisplay;
  if (String(numStr).trim() === '') return defaultDisplay;
  const cleaned = sanitizeForBig(numStr);
  // If sanitize collapses to '0', ensure original looked like zero; else invalid
  if (cleaned === '0') {
    const original = String(numStr)
      .trim()
      .replace(/[\s\u00A0\u202F_’'`]/g, '')
      .replace(/,/g, '.');
    const zeroish = /^[-+]?0*(?:\.?0*)?$/.test(original);
    if (!zeroish) return defaultDisplay;
  }
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(cleaned)) return defaultDisplay;
  const sign = cleaned.startsWith('-') ? '-' : '';
  const [rawInt, rawDec] = cleaned.replace(/^[-+]/, '').split('.') as [
    string,
    string?,
  ];
  const intWithCommas = rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = rawDec ? `${intWithCommas}.${rawDec}` : intWithCommas;
  return sign + formatted;
}

/**
 * Formats a number with commas for thousands separator.
 * @param value - The number to format.
 * @returns Formatted number string.
 */
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
