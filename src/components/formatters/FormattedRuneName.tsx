'use client';

import React from 'react';

import { useRuneInfo } from '@/hooks/useRuneInfo';

interface FormattedRuneNameProps {
  runeName: string | null | undefined;
}

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
