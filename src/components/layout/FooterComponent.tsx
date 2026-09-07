import { Link } from '@tanstack/react-router';

import styles from '@/components/layout/AppInterface.module.css';
import { formatUsd } from '@/utils/formatters';

/**
 * Props for the FooterComponent.
 */
interface FooterComponentProps {
  /** Current Bitcoin price in USD. */
  btcPriceUsd: number | undefined;
  /** Whether Bitcoin price is loading. */
  isBtcPriceLoading: boolean;
  /** Error fetching Bitcoin price. */
  btcPriceError: Error | null;
}

/**
 * Footer component displaying Bitcoin price and social links.
 *
 * @param props - Component props.
 */
function FooterComponent({ btcPriceUsd, isBtcPriceLoading, btcPriceError }: FooterComponentProps) {
  return (
    <div className={styles.btcPriceFooter}>
      {isBtcPriceLoading ? (
        <span>Loading BTC price...</span>
      ) : btcPriceError ? (
        <span className={styles.errorText}>Error loading price</span>
      ) : btcPriceUsd ? (
        <span>BTC Price: {formatUsd(btcPriceUsd)}</span>
      ) : (
        <span>BTC Price: N/A</span>
      )}
      <div className={styles.socialLinks}>
        <Link to="/changelog" className={styles.footerButton} title="Changelog">
          Changelog
        </Link>
        <Link to="/legal" className={styles.footerButton} title="Legal">
          Legal
        </Link>
        <Link to="/docs" className={styles.footerIconButton} title="Documentation">
          <img src="/icons/help_book_big-0.png" alt="Documentation" width={16} height={16} />
        </Link>
        <a
          href="https://github.com/ropl-btc/RunesSwap.app"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          className={styles.socialLink}
        >
          <img src="/icons/github-mark.svg" alt="GitHub" width={16} height={16} />
        </a>
        <a
          href="https://twitter.com/robin_liquidium"
          target="_blank"
          rel="noopener noreferrer"
          title="X (Twitter)"
          className={styles.socialLink}
        >
          <img src="/icons/x-logo.svg" alt="X (Twitter)" width={16} height={16} />
        </a>
      </div>
    </div>
  );
}

export default FooterComponent;
