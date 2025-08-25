'use client';

import React, { useEffect, useState } from 'react';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { useRuneMarketData } from '@/hooks/useRuneMarketData';
import { useRunesInfoStore } from '@/store/runesInfoStore';
import { type RuneInfo as OrdiscanRuneInfo } from '@/types/ordiscan';
import type { Rune } from '@/types/satsTerminal';
import RuneDetails from '@/components/runes/RuneDetails';
import RuneSearchBar from '@/components/runes/RuneSearchBar';
import styles from '@/components/runes/RunesInfoTab.module.css';

interface RunesInfoTabProps {
  onShowPriceChart?: (assetName?: string, shouldToggle?: boolean) => void;
  showPriceChart?: boolean;
}

export function RunesInfoTab({
  onShowPriceChart,
  showPriceChart = false,
}: RunesInfoTabProps) {
  const { selectedRuneInfo: persistedSelectedRuneInfo, setSelectedRuneInfo } =
    useRunesInfoStore();

  const [selectedRuneForInfo, setSelectedRuneForInfo] =
    useState<OrdiscanRuneInfo | null>(persistedSelectedRuneInfo);
  const [showLoading, setShowLoading] = useState(false);

  // Use shared hooks for rune data
  const {
    data: detailedRuneInfo,
    isLoading: isDetailedRuneInfoLoading,
    error: detailedRuneInfoError,
  } = useRuneInfo(selectedRuneForInfo?.name, {
    enabled: !!selectedRuneForInfo,
  });

  const {
    data: runeMarketInfo,
    isLoading: isRuneMarketInfoLoading,
    error: runeMarketInfoError,
  } = useRuneMarketData(selectedRuneForInfo?.name, {
    enabled: !!selectedRuneForInfo,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (detailedRuneInfo || detailedRuneInfoError) {
      setShowLoading(false);
    }

    if (detailedRuneInfo) {
      const updatedInfo: OrdiscanRuneInfo = {
        ...detailedRuneInfo,
        formatted_name:
          detailedRuneInfo.formatted_name || detailedRuneInfo.name,
      } as OrdiscanRuneInfo;

      setSelectedRuneInfo(updatedInfo);
    } else if (detailedRuneInfoError && selectedRuneForInfo) {
      setSelectedRuneInfo(selectedRuneForInfo);
    }
  }, [
    detailedRuneInfo,
    detailedRuneInfoError,
    selectedRuneForInfo,
    setSelectedRuneInfo,
  ]);

  const handleRuneSelect = (rune: Rune) => {
    const minimalRuneInfo: OrdiscanRuneInfo = {
      id: rune.id,
      name: rune.name,
      formatted_name: rune.name,
      symbol: rune.name.split('•')[0] || rune.name,
      decimals: 0,
      number: 0,
      etching_txid: '',
      premined_supply: '0',
      current_supply: '0',
    } as OrdiscanRuneInfo;

    setTimeout(() => {
      setSelectedRuneForInfo(minimalRuneInfo);
      setShowLoading(true);
      if (showPriceChart && onShowPriceChart) {
        onShowPriceChart(rune.name, false);
      }
    }, 200);
  };

  return (
    <div className={styles.runesInfoTabContainer}>
      <h1 className="heading">Runes Info</h1>
      <RuneSearchBar
        onRuneSelect={handleRuneSelect}
        selectedRuneName={selectedRuneForInfo?.name || null}
      />
      <RuneDetails
        selectedRune={selectedRuneForInfo}
        detailedRuneInfo={detailedRuneInfo ?? null}
        detailedRuneInfoError={detailedRuneInfoError ?? null}
        isDetailedRuneInfoLoading={isDetailedRuneInfoLoading}
        runeMarketInfo={runeMarketInfo ?? null}
        isRuneMarketInfoLoading={isRuneMarketInfoLoading}
        runeMarketInfoError={runeMarketInfoError ?? null}
        showLoading={showLoading}
        onShowPriceChart={onShowPriceChart}
        showPriceChart={showPriceChart}
      />
    </div>
  );
}

export default RunesInfoTab;
