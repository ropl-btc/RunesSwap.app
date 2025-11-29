import Big from 'big.js';

import { parseAmount } from '@/utils/formatters';

import {
  convertToRawAmount,
  formatAmountWithPrecision,
  percentageOfRawAmount,
  rawToDisplayAmount,
} from './amountFormatting';

// Re-export core amount utilities for convenience
export {
  convertToRawAmount,
  formatAmountWithPrecision,
  percentageOfRawAmount,
  rawToDisplayAmount,
};

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
    // Convert using shared utility then apply formatting
    const displayBig = new Big(rawToDisplayAmount(rawAmount, decimals));

    const displayDecimals =
      maxDecimals !== undefined ? Math.min(maxDecimals, decimals) : decimals;

    let formattedString = displayBig.toFixed(displayDecimals);

    if (removeTrailingZeros && formattedString.includes('.')) {
      formattedString = formattedString.replace(/\.?0+$/, '');
    }

    return formattedString;
  } catch (error) {
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
    const displayAmount = rawToDisplayAmount(rawAmount, decimals);
    return parseAmount(displayAmount);
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
    const balanceBig = new Big(rawToDisplayAmount(rawAmount, decimals));
    const priceInBtc = new Big(priceInSats).div(1e8);
    return balanceBig.times(priceInBtc).toNumber();
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
    const balanceBig = new Big(rawToDisplayAmount(rawAmount, decimals));
    return balanceBig.times(priceInUsd).toNumber();
  } catch (error) {
    console.warn('Error calculating USD value:', error);
    return 0;
  }
}
