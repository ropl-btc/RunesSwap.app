'use client';

import React from 'react';

import { Loading } from '@/components/loading';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { formatRuneAmount } from '@/utils/runeFormatting';

/**
 * Props for the FormattedRuneAmount component.
 */
interface FormattedRuneAmountProps {
  /** The name of the Rune. */
  runeName: string | null | undefined;
  /** The raw amount string. */
  rawAmount: string | null | undefined;
}

/**
 * Component to display a formatted Rune amount.
 * Fetches Rune info to determine decimals and formats the amount accordingly.
 *
 * @param props - Component props.
 */
export function FormattedRuneAmount({
  runeName,
  rawAmount,
}: FormattedRuneAmountProps) {
  const {
    data: runeInfo,
    isLoading,
    error,
  } = useRuneInfo(runeName, {
    enabled:
      !!runeName &&
      rawAmount !== 'N/A' &&
      rawAmount !== null &&
      rawAmount !== undefined, // Only run if we have a rune name and a valid raw amount
  });

  if (rawAmount === 'N/A' || rawAmount === null || rawAmount === undefined) {
    return <span>N/A</span>;
  }

  if (!runeName) {
    return <span>{rawAmount} (Unknown Rune)</span>; // Should not happen if enabled logic works
  }

  if (isLoading) {
    return <Loading variant="rune-amount" rawAmount={rawAmount} />;
  }

  if (error) {
    // 404 is handled by runeInfo being null, so this only catches other errors
    return <span>{rawAmount} (Error fetching decimals)</span>;
  }

  if (
    !runeInfo ||
    typeof runeInfo.decimals !== 'number' ||
    !Number.isFinite(runeInfo.decimals) ||
    !Number.isInteger(runeInfo.decimals) ||
    runeInfo.decimals < 0
  ) {
    // Rune info loaded but no decimals found (or invalid format), show raw amount
    return <span>{rawAmount} (Decimals N/A)</span>;
  }

  const decimals = runeInfo.decimals;

  // Use the unified formatting utility
  const formattedAmount = formatRuneAmount(rawAmount, decimals);

  // Convert to number for toLocaleString formatting if safe
  const formattedNumber = parseFloat(formattedAmount);

  // Check if conversion to number would lose precision
  if (
    isNaN(formattedNumber) ||
    !Number.isSafeInteger(formattedNumber * Math.pow(10, decimals)) ||
    formattedNumber > Number.MAX_SAFE_INTEGER
  ) {
    // For very large numbers, use string formatting to preserve precision
    return <span>{formattedAmount}</span>;
  }

  // Format the number with appropriate decimal places
  return (
    <span>
      {formattedNumber.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
