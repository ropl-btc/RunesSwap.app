'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import styles from '@/components/layout/AppInterface.module.css';
import buttonStyles from '@/components/ui/Button.module.css';
import { formatUsd } from '@/utils/formatters';

interface FooterComponentProps {
  btcPriceUsd: number | undefined;
  isBtcPriceLoading: boolean;
  btcPriceError: Error | null;
}

export function FooterComponent({
  btcPriceUsd,
  isBtcPriceLoading,
  btcPriceError,
}: FooterComponentProps) {
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
        <Link href="/docs" legacyBehavior passHref>
          <a className={buttonStyles.root} title="Documentation">
            Docs
          </a>
        </Link>
        <Link href="/changelog" legacyBehavior passHref>
          <a className={buttonStyles.root} title="Changelog">
            Changelog
          </a>
        </Link>
        <Link href="/legal" legacyBehavior passHref>
          <a className={buttonStyles.root} title="Legal">
            Legal
          </a>
        </Link>
        <a
          href="https://github.com/ropl-btc/RunesSwap.app"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          className={styles.socialLink}
        >
          <Image
            src="/icons/github-mark.svg"
            alt="GitHub"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://twitter.com/robin_liquidium"
          target="_blank"
          rel="noopener noreferrer"
          title="X (Twitter)"
          className={styles.socialLink}
        >
          <Image
            src="/icons/x-logo.svg"
            alt="X (Twitter)"
            width={16}
            height={16}
          />
        </a>
      </div>
    </div>
  );
}

export default FooterComponent;
