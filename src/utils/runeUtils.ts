/**
 * Utility functions for working with Rune names and identifiers.
 */

/**
 * Normalize a rune name by removing common separator characters like
 * bullet ("•") or dots. This helps ensure consistent lookups when
 * interacting with APIs.
 *
 * @param name - The rune name to normalize.
 * @returns The normalized rune name (no spacers).
 */
export function normalizeRuneName(name: string): string {
  return name.replace(/[•.]/g, '');
}

/**
 * Get the icon URL for a rune name from Unisat.
 *
 * @param name - The rune name.
 * @returns The URL string for the rune icon.
 */
export function getRuneIconUrl(name: string): string {
  return `https://icon.unisat.io/icon/runes/${encodeURIComponent(name)}`;
}
