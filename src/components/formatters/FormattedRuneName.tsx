'use client';

import React from 'react';

import { useRuneInfo } from '@/hooks/useRuneInfo';

/**
 * Props for the FormattedRuneName component.
 */
interface FormattedRuneNameProps {
  /** The name of the Rune. */
  runeName: string | null | undefined;
}

/**
 * Component to display a formatted Rune name (with spacers).
 * Fetches Rune info to get the formatted name.
 *
 * @param props - Component props.
 */
export function FormattedRuneName({ runeName }: FormattedRuneNameProps) {
  const { data: runeInfo } = useRuneInfo(runeName, {
    enabled: !!runeName && runeName !== 'N/A',
  });

  // Handle invalid rune names
  if (!runeName || runeName === 'N/A') {
    return <span>N/A</span>;
  }

  // Show formatted name if available, otherwise fall back to regular name
  return <span>{runeInfo?.formatted_name || runeName}</span>;
}
