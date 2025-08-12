'use client';

import React from 'react';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { formatRuneAmount } from '@/utils/runeFormatting';
import { LoadingRuneAmount } from './LoadingSpinner';

interface FormattedRuneAmountProps {
  runeName: string | null | undefined;
  rawAmount: string | null | undefined;
}

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
    return <LoadingRuneAmount rawAmount={rawAmount} />;
  }

  if (error) {
    // 404 is handled by runeInfo being null, so this only catches other errors
    return <span>{rawAmount} (&apos;Error fetching decimals&apos;)</span>;
  }

  if (!runeInfo || typeof runeInfo.decimals !== 'number') {
    // Rune info loaded but no decimals found (or invalid format), show raw amount
    return <span>{rawAmount} (Decimals N/A)</span>;
  }

  const decimals = runeInfo.decimals;

  // Use the unified formatting utility
  const formattedAmount = formatRuneAmount(rawAmount, decimals);

  return <span>{formattedAmount}</span>;
}
