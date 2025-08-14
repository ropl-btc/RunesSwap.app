import Big from 'big.js';

/**
 * Unified rune amount formatting utility using Big.js for precision
 * This replaces all existing formatRuneAmount implementations
 */

export interface RuneFormattingOptions {
  /**
   * Maximum number of decimal places to display
   * @default Uses the full precision available
   */
  maxDecimals?: number;
  /**
   * Whether to remove trailing zeros
   * @default true
   */
  removeTrailingZeros?: boolean;
}

/**
 * Formats a raw rune amount with decimals using Big.js for precision
 * @param rawAmount - The raw amount as a string
 * @param decimals - Number of decimal places for the rune
 * @param options - Formatting options
 * @returns Formatted amount as string
 */
export function formatRuneAmount(
  rawAmount: string | number,
  decimals: number,
  options: RuneFormattingOptions = {},
): string {
  const { maxDecimals, removeTrailingZeros = true } = options;

  try {
    // Convert to Big.js for precise calculations
    const rawAmountBig = new Big(rawAmount.toString());

    if (decimals === 0) {
      // No decimal places needed, just format for display
      return rawAmountBig.toFixed(0);
    }

    // Create divisor using Big.js to maintain precision
    const divisor = new Big(10).pow(decimals);

    // Perform precise division
    const formattedAmountBig = rawAmountBig.div(divisor);

    // Determine decimal places to show
    const displayDecimals =
      maxDecimals !== undefined ? Math.min(maxDecimals, decimals) : decimals;

    // Format with appropriate decimal places
    let formattedString = formattedAmountBig.toFixed(displayDecimals);

    // Remove trailing zeros if requested
    if (removeTrailingZeros && formattedString.includes('.')) {
      formattedString = formattedString.replace(/\.?0+$/, '');
    }

    // Use Big.js for all formatting to preserve precision
    return formattedString;
  } catch (error) {
    // Fallback to raw amount on any error
    console.warn('Error formatting rune amount:', error);
    return rawAmount.toString();
  }
}

/**
 * Calculates the actual balance from raw amount and decimals
 * @param rawAmount - The raw amount as a string
 * @param decimals - Number of decimal places for the rune
 * @returns Actual balance as a number
 */
export function calculateActualBalance(
  rawAmount: string | number,
  decimals: number,
): number {
  try {
    const rawAmountBig = new Big(rawAmount.toString());
    const divisor = new Big(10).pow(decimals);
    return parseFloat(rawAmountBig.div(divisor).toFixed());
  } catch (error) {
    console.warn('Error calculating actual balance:', error);
    return 0;
  }
}

/**
 * Calculates value in BTC from rune amount
 * @param rawAmount - The raw amount as a string
 * @param decimals - Number of decimal places for the rune
 * @param priceInSats - Price per unit in satoshis
 * @returns Value in BTC
 */
export function calculateBtcValue(
  rawAmount: string | number,
  decimals: number,
  priceInSats: number,
): number {
  try {
    const balanceBig = new Big(rawAmount.toString());
    const divisor = new Big(10).pow(decimals);
    const priceInBtc = new Big(priceInSats).div(1e8);

    return parseFloat(balanceBig.div(divisor).times(priceInBtc).toFixed());
  } catch (error) {
    console.warn('Error calculating BTC value:', error);
    return 0;
  }
}

/**
 * Calculates value in USD from rune amount
 * @param rawAmount - The raw amount as a string
 * @param decimals - Number of decimal places for the rune
 * @param priceInUsd - Price per unit in USD
 * @returns Value in USD
 */
export function calculateUsdValue(
  rawAmount: string | number,
  decimals: number,
  priceInUsd: number,
): number {
  try {
    const balanceBig = new Big(rawAmount.toString());
    const divisor = new Big(10).pow(decimals);

    return parseFloat(balanceBig.div(divisor).times(priceInUsd).toFixed());
  } catch (error) {
    console.warn('Error calculating USD value:', error);
    return 0;
  }
}
