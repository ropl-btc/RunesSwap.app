'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormattedRuneAmount } from '@/components/formatters/FormattedRuneAmount';
import styles from '@/components/portfolio/PortfolioTab.module.css';
import RuneIcon from '@/components/runes/RuneIcon';
import { logger } from '@/lib/logger';
import { formatNumberWithLocale } from '@/utils/formatters';
import { calculateActualBalance } from '@/utils/runeFormatting';

const formatCollateralAmount = (
  amount: number,
  divisibility: number,
): string => {
  if (divisibility === 0) {
    return formatNumberWithLocale(amount);
  }

  const actualBalance = calculateActualBalance(amount, divisibility);
  return formatNumberWithLocale(actualBalance, {
    minimumFractionDigits: 0,
    maximumFractionDigits: divisibility,
  });
};

/**
 * Props for the FormattedLiquidiumCollateral component.
 */
interface FormattedLiquidiumCollateralProps {
  /** The ID of the Rune used as collateral. */
  runeId: string;
  /** The amount of the Rune. */
  runeAmount: number;
  /** The divisibility of the Rune. */
  runeDivisibility: number;
}

/**
 * Component to display formatted Liquidium collateral details.
 * Fetches Rune information to display the name and icon, or falls back to the ID.
 *
 * @param props - Component props.
 */
export function FormattedLiquidiumCollateral({
  runeId,
  runeAmount,
  runeDivisibility,
}: FormattedLiquidiumCollateralProps) {
  // Fetch rune info to get the actual rune name
  const { data: runeInfo } = useQuery({
    queryKey: ['runeInfoById', runeId],
    queryFn: async () => {
      if (!runeId) return null;
      try {
        const response = await fetch(
          `/api/ordiscan/rune-info-by-id?prefix=${encodeURIComponent(runeId)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data) {
            return data;
          }
        }
      } catch (error) {
        logger.error('Error fetching rune by ID', { error, runeId }, 'API');
      }
      return null;
    },
    enabled: !!runeId,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const runeName = runeInfo?.name ?? null;
  const formattedRuneName = runeInfo?.formatted_name ?? runeInfo?.name ?? null;

  // If we have a rune name, use FormattedRuneAmount
  if (runeName) {
    const displayName = formattedRuneName || runeName;

    return (
      <div className={styles.collateralContainer}>
        <RuneIcon
          src={runeInfo?.imageURI}
          alt=""
          className={styles.runeImage}
          width={20}
          height={20}
        />
        <div className={styles.collateralDetails}>
          <div className={styles.collateralAmount}>
            <FormattedRuneAmount
              runeName={runeName}
              rawAmount={String(runeAmount)}
            />
          </div>
          <div className={styles.collateralName}>{displayName}</div>
        </div>
      </div>
    );
  }

  // If we don't have a rune name yet, show the raw amount with the rune ID
  return (
    <div className={styles.collateralDetails}>
      <div className={styles.collateralAmount}>
        {formatCollateralAmount(runeAmount, runeDivisibility)}
      </div>
      <div className={styles.collateralName}>{runeId}</div>
    </div>
  );
}
