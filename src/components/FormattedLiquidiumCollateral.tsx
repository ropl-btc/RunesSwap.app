'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { calculateActualBalance } from '@/utils/runeFormatting';
import { FormattedRuneAmount } from './FormattedRuneAmount';
import styles from './PortfolioTab.module.css';
import RuneIcon from './RuneIcon';

interface FormattedLiquidiumCollateralProps {
  runeId: string;
  runeAmount: number;
  runeDivisibility: number;
}

export function FormattedLiquidiumCollateral({
  runeId,
  runeAmount,
  runeDivisibility,
}: FormattedLiquidiumCollateralProps) {
  const [runeName, setRuneName] = useState<string | null>(null);
  const [formattedRuneName, setFormattedRuneName] = useState<string | null>(
    null,
  );
  const [runeIdForQuery, setRuneIdForQuery] = useState<string | null>(null);

  // Use the full rune_id for querying
  useEffect(() => {
    if (runeId) {
      setRuneIdForQuery(runeId);
    }
  }, [runeId]);

  // Fetch rune info to get the actual rune name
  const { data: runeInfo } = useQuery({
    queryKey: ['runeInfoById', runeIdForQuery],
    queryFn: async () => {
      // Try to fetch by the full rune_id
      if (runeIdForQuery) {
        try {
          // We'll try to find a rune with this ID in our database
          const response = await fetch(
            `/api/ordiscan/rune-info-by-id?prefix=${encodeURIComponent(runeIdForQuery)}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data) {
              return data;
            }
          }
        } catch (error) {
          console.error('Error fetching rune by ID:', error);
        }
      }
      return null;
    },
    enabled: !!runeIdForQuery,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Update state when runeInfo changes
  useEffect(() => {
    if (runeInfo) {
      if (runeInfo.name) {
        setRuneName(runeInfo.name);
      }
      if (runeInfo.formatted_name) {
        setFormattedRuneName(runeInfo.formatted_name);
      } else if (runeInfo.name) {
        setFormattedRuneName(runeInfo.name);
      }
    }
  }, [runeInfo]);

  // Format the amount based on divisibility
  const formattedAmount = (amount: number, divisibility: number): string => {
    if (divisibility === 0) {
      return amount.toLocaleString();
    }

    const formattedValue = calculateActualBalance(
      amount,
      divisibility,
    ).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: divisibility,
    });

    return formattedValue;
  };

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
        {formattedAmount(runeAmount, runeDivisibility)}
      </div>
      <div className={styles.collateralName}>{runeId}</div>
    </div>
  );
}
