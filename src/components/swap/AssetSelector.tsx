import React, { useEffect, useState } from 'react';

import AssetSelectorDropdown from '@/components/swap/AssetSelectorDropdown';
import useAssetSearch from '@/hooks/useAssetSearch';
import type { Asset } from '@/types/common';

/**
 * Props for the AssetSelector component.
 */
interface AssetSelectorProps {
  /** The currently selected asset. */
  selectedAsset: Asset | null;
  /** Callback when an asset is selected. */
  onAssetChange: (asset: Asset) => void;
  /** List of available assets to select from. */
  availableAssets: Asset[];
  /** Whether the selector is disabled. */
  disabled?: boolean;
  /** Whether to show BTC as an option in the selector. */
  showBtcInSelector?: boolean;
  /** Whether assets are currently loading. */
  isAssetsLoading?: boolean;
  /** Error message if loading assets failed. */
  assetsError?: string | null;
  /** Whether a preselected asset is loading. */
  isPreselectedAssetLoading?: boolean;
}

/**
 * Component for selecting an asset from a list.
 * Handles searching and filtering of assets.
 * Wraps the AssetSelectorDropdown component.
 *
 * @param props - Component props.
 */
const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onAssetChange,
  availableAssets,
  disabled = false,
  showBtcInSelector = true,
  isAssetsLoading = false,
  assetsError = null,
  isPreselectedAssetLoading = false,
}) => {
  const {
    searchQuery,
    handleSearchChange,
    displayedAssets,
    isLoadingAssets,
    currentError,
  } = useAssetSearch({ availableAssets, isAssetsLoading, assetsError });

  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    const shouldAnimate = isLoadingAssets || isPreselectedAssetLoading;

    if (!shouldAnimate) {
      setLoadingDots('');
      return;
    }

    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev === '...' ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [isLoadingAssets, isPreselectedAssetLoading]);

  return (
    <AssetSelectorDropdown
      selectedAsset={selectedAsset}
      onAssetChange={onAssetChange}
      availableAssets={displayedAssets}
      disabled={disabled}
      showBtcInSelector={showBtcInSelector}
      isAssetsLoading={isLoadingAssets}
      assetsError={currentError}
      isPreselectedAssetLoading={isPreselectedAssetLoading}
      searchQuery={searchQuery}
      onSearchChange={(e) => handleSearchChange(e.target.value)}
      loadingDots={loadingDots}
    />
  );
};

export default AssetSelector;
