import Big from 'big.js';

/**
 * Formats an amount with precise decimal handling using Big.js
 * This is used to avoid precision issues when handling token amounts
 *
 * @param amount - The amount to format
 * @param decimals - Number of decimal places the token supports
 * @returns Formatted amount as string
 */
export function formatAmountWithPrecision(
  amount: number | string,
  decimals: number,
): string {
  const newAmountBig = new Big(amount);
  const multiplier = new Big(10).pow(decimals);

  // Return Big.js string directly to prevent precision loss and exponential notation
  return newAmountBig
    .times(multiplier)
    .round(0, Big.roundDown)
    .div(multiplier)
    .toFixed();
}

/**
 * Converts a raw token amount (integer string) to a human display string
 * using Big.js for precise division.
 *
 * @param rawAmount - Raw on-chain amount as string or number
 * @param decimals - Token decimals
 * @returns Display amount as string (no exponential notation)
 */
export function rawToDisplayAmount(
  rawAmount: number | string,
  decimals: number,
): string {
  const raw = new Big(rawAmount);
  const divisor = new Big(10).pow(decimals);
  return raw.div(divisor).toFixed();
}

/**
 * Converts raw token amount to formatted amount for API calls
 *
 * @param amount - The display amount (e.g., 1.5)
 * @param decimals - Number of decimal places the token supports
 * @returns Raw amount as string for API
 */
export function convertToRawAmount(
  amount: number | string,
  decimals: number,
): string {
  const amountBig = new Big(amount);
  const multiplier = new Big(10).pow(decimals);

  return amountBig.times(multiplier).round(0, Big.roundDown).toFixed(0);
}

/**
 * Calculates a percentage of a raw balance and returns a display string
 * with correct decimal precision.
 *
 * @param rawAmount - Raw on-chain balance as string or number
 * @param decimals - Token decimals
 * @param percentage - Percentage as decimal (e.g., 0.25 for 25%)
 * @returns Display amount string respecting token decimals
 */
export function percentageOfRawAmount(
  rawAmount: number | string,
  decimals: number,
  percentage: number,
): string {
  const available = new Big(rawAmount).div(new Big(10).pow(decimals));
  const desired = percentage === 1 ? available : available.times(percentage);
  // Ensure we do not exceed decimal precision
  return formatAmountWithPrecision(desired.toString(), decimals);
}
