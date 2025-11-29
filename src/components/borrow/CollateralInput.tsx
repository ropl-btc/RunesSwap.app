import React from 'react';

import InputArea from '@/components/swap/InputArea';
import type { Asset } from '@/types/common';

/**
 * Props for the CollateralInput component.
 */
interface CollateralInputProps {
  /** Whether the wallet is connected. */
  connected: boolean;
  /** The selected collateral asset. */
  collateralAsset: Asset | null;
  /** Callback when collateral asset changes. */
  onCollateralAssetChange: (asset: Asset) => void;
  /** The amount of collateral. */
  collateralAmount: string;
  /** Callback when collateral amount changes. */
  onCollateralAmountChange: (value: string) => void;
  /** List of available assets for collateral. */
  availableAssets: Asset[];
  /** Whether assets are loading. */
  isAssetsLoading?: boolean | undefined;
  /** Error loading assets. */
  assetsError?: string | null | undefined;
  /** Display element for available balance. */
  availableBalance?: React.ReactNode | undefined;
  /** USD value of the collateral amount. */
  usdValue: string | undefined;
  /** Min/Max range string for display. */
  minMaxRange?: string | undefined;
  /** Whether the input is disabled. */
  disabled?: boolean | undefined;
  /** Callback when a percentage shortcut is clicked. */
  onPercentageClick: ((percentage: number) => void) | undefined;
}

/**
 * Component for inputting collateral amount and selecting asset.
 * Wraps the generic InputArea component with specific props for collateral.
 *
 * @param props - Component props.
 */
const CollateralInput: React.FC<CollateralInputProps> = ({
  connected,
  collateralAsset,
  onCollateralAssetChange,
  collateralAmount,
  onCollateralAmountChange,
  availableAssets,
  isAssetsLoading = false,
  assetsError = null,
  availableBalance,
  usdValue,
  minMaxRange,
  disabled = false,
  onPercentageClick,
}) => (
  <InputArea
    label="Collateral Amount (Rune)"
    inputId="collateral-amount"
    inputValue={collateralAmount}
    onInputChange={onCollateralAmountChange}
    placeholder="0.0"
    min="0"
    step="any"
    disabled={disabled}
    assetSelectorEnabled
    selectedAsset={collateralAsset}
    onAssetChange={onCollateralAssetChange}
    availableAssets={availableAssets}
    showBtcInSelector={false}
    isAssetsLoading={isAssetsLoading}
    assetsError={assetsError}
    showPercentageShortcuts={connected && !!collateralAsset}
    onPercentageClick={onPercentageClick}
    availableBalance={availableBalance}
    usdValue={usdValue}
    minMaxRange={minMaxRange}
    errorMessage={undefined}
  />
);

export default CollateralInput;
