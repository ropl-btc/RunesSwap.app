import type { ProviderType } from '@omnisat/lasereyes';
import Image from 'next/image';
import React from 'react';

import styles from '@/components/wallet/ConnectWalletButton.module.css';

/**
 * Represents a wallet option available for connection.
 */
export interface WalletOption {
  /** Display name of the wallet. */
  name: string;
  /** Provider type identifier. */
  provider: ProviderType;
  /** Optional disclaimer or warning message. */
  disclaimer?: string;
}

/**
 * Props for the WalletOptionsList component.
 */
interface WalletOptionsListProps {
  /** List of wallet options to display. */
  wallets: WalletOption[];
  /** Callback when a wallet is selected. */
  onSelect: (provider: ProviderType) => void;
  /** Whether a connection is currently in progress. */
  isConnecting: boolean;
}

/**
 * Component that renders a list of available wallet options.
 *
 * @param props - Component props.
 */
const WalletOptionsList: React.FC<WalletOptionsListProps> = ({
  wallets,
  onSelect,
  isConnecting,
}) => (
  <div className={styles.dropdown}>
    {wallets.map(({ name, provider, disclaimer }) => (
      <div key={provider} className={styles.dropdownItemContainer}>
        <button
          onClick={() => onSelect(provider)}
          className={styles.dropdownItem}
          disabled={isConnecting}
        >
          <span>{name}</span>
          {disclaimer && (
            <div
              className={styles.warningIconContainer}
              title={`Warning: ${disclaimer}`}
            >
              <Image
                src="/icons/msg_warning-0.png"
                alt="Warning"
                className={styles.warningIcon}
                width={16}
                height={16}
              />
            </div>
          )}
        </button>
      </div>
    ))}
  </div>
);

export default WalletOptionsList;
