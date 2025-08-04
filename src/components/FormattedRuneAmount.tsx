'use client';

import { useQuery } from '@tanstack/react-query';
import Big from 'big.js';
import React from 'react';
import { fetchRuneInfoFromApi } from '@/lib/api';
import type { RuneData } from '@/lib/runesData';

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
  } = useQuery<RuneData | null, Error>({
    // Update queryKey to reflect API usage
    queryKey: ['runeInfoApi', (runeName || '').toUpperCase()],
    // Use the new API client function
    queryFn: () =>
      runeName ? fetchRuneInfoFromApi(runeName) : Promise.resolve(null),
    enabled:
      !!runeName &&
      rawAmount !== 'N/A' &&
      rawAmount !== null &&
      rawAmount !== undefined, // Only run if we have a rune name and a valid raw amount
    staleTime: Infinity, // Decimals rarely change, cache indefinitely
    // Remove specific 404 retry logic, as API client returns null for 404 (treated as success by useQuery)
    retry: 2, // Retry other network/server errors twice
  });

  if (rawAmount === 'N/A' || rawAmount === null || rawAmount === undefined) {
    return <span>N/A</span>;
  }

  if (!runeName) {
    return <span>{rawAmount} (Unknown Rune)</span>; // Should not happen if enabled logic works
  }

  if (isLoading) {
    return <span>{rawAmount} (Loading decimals...)</span>;
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

  // Calculate and format with decimals using Big.js for precision
  try {
    // Use Big.js for precise decimal calculations
    const rawAmountBig = new Big(rawAmount);

    if (decimals === 0) {
      // No decimal places needed, just format for display
      return <span>{rawAmountBig.toFixed(0)}</span>;
    }

    // Create divisor using Big.js to maintain precision
    const divisor = new Big(10).pow(decimals);

    // Perform precise division
    const formattedAmountBig = rawAmountBig.div(divisor);

    // Format with appropriate decimal places, removing trailing zeros
    const formattedString = formattedAmountBig.toFixed();

    // Convert to number for toLocaleString formatting if safe
    const formattedNumber = parseFloat(formattedString);

    if (isNaN(formattedNumber)) {
      throw new Error('Calculated amount is NaN');
    }

    // Format the number with appropriate decimal places
    return (
      <span>
        {formattedNumber.toLocaleString(undefined, {
          maximumFractionDigits: decimals,
        })}
      </span>
    );
  } catch {
    return <span>{rawAmount} (Formatting Error)</span>; // Fallback
  }
}
