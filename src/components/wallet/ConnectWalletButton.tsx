'use client';

import React from 'react';

import styles from '@/components/wallet/ConnectWalletButton.module.css';
import WalletOptionsList from '@/components/wallet/WalletOptionsList';
import {
  AVAILABLE_WALLETS,
  useWalletConnection,
} from '@/hooks/useWalletConnection';
import { truncateAddress } from '@/utils/formatters';

/**
 * Render a wallet connection control that reflects connection state and provides actions.
 *
 * Displays one of three primary UI states: when connected it shows the connected wallet's
 * name and truncated address with a Disconnect button; when connecting it shows a disabled
 * "Connecting..." button; otherwise it shows a "Connect Wallet" button that toggles a
 * dropdown of available wallets. If a connection error exists, an error message is shown
 * with an optional external install link.
 *
 * @returns JSX element representing the wallet connection control in one of its three states.
 */
function ConnectWalletButton() {
  const {
    connected,
    isConnecting,
    address,
    provider,
    connectionError,
    installLink,
    isDropdownOpen,
    dropdownRef,
    toggleDropdown,
    handleConnect,
    handleDisconnect,
  } = useWalletConnection();

  if (connected && address) {
    const connectedWalletName =
      AVAILABLE_WALLETS.find((w) => w.provider === provider)?.name ||
      provider ||
      'Wallet';
    return (
      <div className={styles.connectedInfo}>
        <span className={styles.connectedText}>
          {connectedWalletName}: {truncateAddress(address)}
        </span>
        <button onClick={handleDisconnect} className={styles.connectButton}>
          Disconnect
        </button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <button className={styles.connectButton} disabled>
        Connecting...
      </button>
    );
  }

  return (
    <div className={styles.connectContainer} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={styles.connectButton}
        disabled={isConnecting}
      >
        Connect Wallet
      </button>
      {isDropdownOpen && (
        <WalletOptionsList
          wallets={AVAILABLE_WALLETS}
          onSelect={handleConnect}
          isConnecting={isConnecting}
        />
      )}
      {connectionError && (
        <div className={styles.errorMessage}>
          <p>{connectionError}</p>
          {installLink && (
            <a
              href={installLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.installLink}
            >
              Install Wallet
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectWalletButton;
