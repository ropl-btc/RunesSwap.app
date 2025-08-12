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

  const formattedAmount = parseFloat(
    newAmountBig
      .times(multiplier)
      .round(0, Big.roundDown)
      .div(multiplier)
      .toFixed(),
  );

  return formattedAmount.toString();
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

  return amountBig.times(multiplier).round(0, Big.roundDown).toFixed();
}
