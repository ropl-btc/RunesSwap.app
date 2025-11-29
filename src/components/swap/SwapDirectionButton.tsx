import { ArrowPathIcon } from '@heroicons/react/24/solid';
import React from 'react';

import styles from '@/components/swap/SwapDirectionButton.module.css';
import type { Asset } from '@/types/common';

/**
 * Props for the SwapDirectionButton component.
 */
interface SwapDirectionButtonProps {
  /**
   * The input asset in the swap
   */
  assetIn: Asset | null;

  /**
   * The output asset in the swap
   */
  assetOut: Asset | null;

  /**
   * Whether the button should be disabled
   */
  disabled?: boolean;

  /**
   * Function to call when the button is clicked
   */
  onClick: () => void;
}

/**
 * Button component that allows users to swap the direction of assets in a trade
 */
export const SwapDirectionButton: React.FC<SwapDirectionButtonProps> = ({
  assetIn,
  assetOut,
  disabled = false,
  onClick,
}) => (
  <div className={styles.swapIconContainer}>
    <button
      onClick={onClick}
      className={styles.swapIconButton}
      aria-label="Swap direction"
      disabled={disabled || !assetIn || !assetOut}
    >
      <ArrowPathIcon className={styles.swapIcon} />
    </button>
  </div>
);

export default SwapDirectionButton;
