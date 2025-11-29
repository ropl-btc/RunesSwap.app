import React from 'react';

import styles from '@/components/swap/InputArea.module.css';

/**
 * Props for the AmountHelpers component.
 */
interface AmountHelpersProps {
  /** Whether to show percentage shortcut buttons (25%, 50%, 75%, Max). */
  showPercentageShortcuts?: boolean | undefined;
  /** Callback when a percentage shortcut is clicked. */
  onPercentageClick: ((percentage: number) => void) | undefined;
  /** Display element for available balance. */
  availableBalance?: React.ReactNode | undefined;
  /** Whether the buttons are disabled. */
  disabled?: boolean | undefined;
}

/**
 * Component to display amount helper shortcuts (percentages) and available balance.
 *
 * @param props - Component props.
 */
const AmountHelpers: React.FC<AmountHelpersProps> = ({
  showPercentageShortcuts = false,
  onPercentageClick,
  availableBalance,
  disabled = false,
}) => {
  if (!showPercentageShortcuts && !availableBalance) {
    return null;
  }

  return (
    <span className={styles.availableBalance}>
      {showPercentageShortcuts && onPercentageClick && (
        <span className={styles.percentageShortcuts}>
          <button
            className={styles.percentageButton}
            onClick={() => onPercentageClick(0.25)}
            type="button"
            disabled={disabled}
          >
            25%
          </button>
          {' | '}
          <button
            className={styles.percentageButton}
            onClick={() => onPercentageClick(0.5)}
            type="button"
            disabled={disabled}
          >
            50%
          </button>
          {' | '}
          <button
            className={styles.percentageButton}
            onClick={() => onPercentageClick(0.75)}
            type="button"
            disabled={disabled}
          >
            75%
          </button>
          {' | '}
          <button
            className={styles.percentageButton}
            onClick={() => onPercentageClick(1)}
            type="button"
            disabled={disabled}
          >
            Max
          </button>
          {availableBalance ? ' • ' : ''}
        </span>
      )}
      {availableBalance && <>Available: {availableBalance}</>}
    </span>
  );
};

export default AmountHelpers;
