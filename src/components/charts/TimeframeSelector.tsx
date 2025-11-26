import React from 'react';

import styles from '@/components/layout/AppInterface.module.css';
import type { Timeframe } from '@/hooks/usePriceChart';

/**
 * Props for the TimeframeSelector component.
 */
interface TimeframeSelectorProps {
  /** The currently selected timeframe. */
  timeframe: Timeframe;
  /** Callback when the timeframe changes. */
  onChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['24h', '7d', '30d', '90d'];

/**
 * Component to select the timeframe for the price chart.
 *
 * @param props - Component props.
 */
const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onChange,
}) => (
  <div className={styles.timeframeSelectorBottom}>
    {TIMEFRAMES.map((tf) => (
      <button
        key={tf}
        className={`${styles.timeframeButton} ${timeframe === tf ? styles.timeframeButtonActive : ''}`}
        onClick={() => onChange(tf)}
      >
        {tf}
      </button>
    ))}
  </div>
);

export default TimeframeSelector;
