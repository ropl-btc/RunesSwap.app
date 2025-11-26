import { useState } from 'react';

import usePriceHistory from '@/hooks/usePriceHistory';

export type Timeframe = '24h' | '7d' | '30d' | '90d';

/**
 * Hook to manage price chart state including timeframe and tooltip visibility.
 * Composes usePriceHistory to fetch data.
 *
 * @param assetName - Name of the asset to chart.
 * @param defaultTimeframe - Initial timeframe selection (default: '24h').
 * @returns Chart data, state, and control functions.
 */
export default function usePriceChart(
  assetName: string,
  defaultTimeframe: Timeframe = '24h',
) {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<Timeframe>(defaultTimeframe);
  const [showTooltip, setShowTooltip] = useState(false);

  const priceHistory = usePriceHistory(assetName, selectedTimeframe);

  return {
    ...priceHistory,
    selectedTimeframe,
    setSelectedTimeframe,
    showTooltip,
    setShowTooltip,
  };
}
