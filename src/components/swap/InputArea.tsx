import Image from 'next/image';
import type { ReactNode } from 'react';
import React from 'react';

import AmountHelpers from '@/components/swap/AmountHelpers';
import AssetSelector from '@/components/swap/AssetSelector';
import styles from '@/components/swap/InputArea.module.css';
import type { Asset } from '@/types/common';

/**
 * Props for the InputArea component.
 */
interface InputAreaProps {
  /** Label for the input area. */
  label: string;
  /** ID for the input element. */
  inputId: string;
  /** Current value of the input. */
  inputValue: string;
  /** Callback when input value changes. */
  onInputChange?: (value: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Whether the input is read-only. */
  readOnly?: boolean;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** Minimum value for the input. */
  min?: string;
  /** Step value for the input. */
  step?: string;

  /** Whether the asset selector is enabled. */
  assetSelectorEnabled?: boolean;
  /** The currently selected asset. */
  selectedAsset?: Asset | null;
  /** Callback when asset changes. */
  onAssetChange?: (asset: Asset) => void;
  /** List of available assets. */
  availableAssets?: Asset[];
  /** Whether to show BTC in the asset selector. */
  showBtcInSelector?: boolean;
  /** Whether assets are loading. */
  isAssetsLoading?: boolean;
  /** Error message for assets loading. */
  assetsError?: string | null;
  /** Whether a preselected asset is loading. */
  isPreselectedAssetLoading?: boolean;

  /** Custom component to render instead of the default asset selector. */
  assetSelectorComponent?: ReactNode;

  /** Whether to show percentage shortcut buttons. */
  showPercentageShortcuts?: boolean | undefined;
  /** Callback when a percentage shortcut is clicked. */
  onPercentageClick?: ((percentage: number) => void) | undefined;
  /** Display element for available balance. */
  availableBalance?: ReactNode | undefined;

  /** USD value display string. */
  usdValue?: string | undefined;
  /** Min/Max range display string. */
  minMaxRange?: string | undefined;
  /** Error message to display below the input. */
  errorMessage: string | undefined;
  /** Additional content to render at the bottom of the input area. */
  bottomContent?: ReactNode;
}

/**
 * Component for a generic input area with optional asset selection and amount helpers.
 * Used for both input and output fields in the swap interface.
 *
 * @param props - Component props.
 */
export const InputArea: React.FC<InputAreaProps> = ({
  label,
  inputId,
  inputValue,
  onInputChange,
  placeholder = '0.0',
  readOnly = false,
  disabled = false,
  min = '0',
  step = '0.001',
  assetSelectorEnabled = false,
  selectedAsset = null,
  onAssetChange,
  availableAssets = [],
  showBtcInSelector = true,
  isAssetsLoading = false,
  assetsError = null,
  isPreselectedAssetLoading = false,
  assetSelectorComponent,
  showPercentageShortcuts = false,
  onPercentageClick,
  availableBalance,
  usdValue,
  minMaxRange,
  errorMessage,
  bottomContent,
}) => (
  <div className={styles.inputArea}>
    <div className={styles.inputHeader}>
      <label htmlFor={inputId} className={styles.inputLabel}>
        {label}
      </label>
      <AmountHelpers
        showPercentageShortcuts={showPercentageShortcuts}
        onPercentageClick={onPercentageClick}
        availableBalance={availableBalance}
        disabled={disabled}
      />
    </div>

    <div className={styles.inputRow}>
      <input
        type={readOnly ? 'text' : 'number'}
        id={inputId}
        placeholder={placeholder}
        value={inputValue}
        onChange={
          onInputChange ? (e) => onInputChange(e.target.value) : undefined
        }
        className={readOnly ? styles.amountInputReadOnly : styles.amountInput}
        readOnly={readOnly}
        disabled={disabled}
        min={min}
        step={step}
      />
      {assetSelectorEnabled ? (
        <AssetSelector
          selectedAsset={selectedAsset}
          onAssetChange={onAssetChange ?? (() => {})}
          availableAssets={availableAssets}
          disabled={disabled}
          showBtcInSelector={showBtcInSelector}
          isAssetsLoading={isAssetsLoading}
          assetsError={assetsError}
          isPreselectedAssetLoading={isPreselectedAssetLoading}
        />
      ) : (
        assetSelectorComponent
      )}
    </div>

    {(usdValue || minMaxRange) && (
      <div
        className={styles.usdValueText}
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <div>{usdValue && `≈ ${usdValue}`}</div>
        <div>{minMaxRange}</div>
      </div>
    )}

    {errorMessage && (
      <div
        className={`${styles.errorText} ${styles.messageWithIcon}`}
        style={{ paddingTop: '0.25rem', width: '100%' }}
      >
        <Image
          src="/icons/msg_error-0.png"
          alt="Error"
          className={styles.messageIcon}
          width={16}
          height={16}
        />
        <span>{errorMessage}</span>
      </div>
    )}

    {bottomContent}
  </div>
);

export default InputArea;
