'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import styles from '@/components/layout/AppInterface.module.css';
import { Loading } from '@/components/loading';
import { useSharedLaserEyes } from '@/context/LaserEyesContext';
import useBtcPrice from '@/hooks/useBtcPrice';
import type { Asset } from '@/types/common';

// Dynamic imports for tab components (performance optimization)

const BorrowTab = dynamic(() => import('@/components/borrow/BorrowTab'), {
  loading: () => (
    <Loading
      variant="progress"
      className={styles.tabLoading || undefined}
      message="Loading borrow tab..."
    />
  ),
});

const PortfolioTab = dynamic(
  () => import('@/components/portfolio/PortfolioTab'),
  {
    loading: () => (
      <Loading
        variant="progress"
        className={styles.tabLoading || undefined}
        message="Loading portfolio..."
      />
    ),
  },
);

const PriceChart = dynamic(() => import('@/components/charts/PriceChart'), {
  loading: () => (
    <Loading
      variant="progress"
      className={styles.chartLoading || undefined}
      message="Loading chart..."
    />
  ),
});

const RunesInfoTab = dynamic(() => import('@/components/runes/RunesInfoTab'), {
  loading: () => (
    <Loading
      variant="progress"
      className={styles.tabLoading || undefined}
      message="Loading runes info..."
    />
  ),
});

const SwapTab = dynamic(() => import('@/components/swap/SwapTab'), {
  loading: () => (
    <Loading
      variant="progress"
      className={styles.tabLoading || undefined}
      message="Loading swap interface..."
    />
  ),
});

const YourTxsTab = dynamic(() => import('@/components/portfolio/YourTxsTab'), {
  loading: () => (
    <Loading
      variant="progress"
      className={styles.tabLoading || undefined}
      message="Loading transactions..."
    />
  ),
});

// --- Props Interface --- Update the activeTab type
/**
 * Props for the AppInterface component.
 */
interface AppInterfaceProps {
  /** The currently active tab. */
  activeTab: 'swap' | 'runesInfo' | 'yourTxs' | 'portfolio' | 'borrow'; // <-- Added 'borrow'
}
// --- End Props ---

// --- Component ---
/**
 * Main application interface component.
 * Manages tab navigation, state for selected assets, and renders the active tab content.
 * Handles dynamic loading of tab components.
 *
 * @param props - Component props.
 */
export function AppInterface({ activeTab }: AppInterfaceProps) {
  const searchParams = useSearchParams();
  const preSelectedRune = searchParams.get('rune');

  const [showSwapTabPriceChart, setShowSwapTabPriceChart] = useState(false);
  const [showRunesInfoTabPriceChart, setShowRunesInfoTabPriceChart] =
    useState(false);

  const [swapTabSelectedAsset, setSwapTabSelectedAsset] = useState(
    preSelectedRune || 'LIQUIDIUM•TOKEN',
  );
  const [runesInfoTabSelectedAsset, setRunesInfoTabSelectedAsset] =
    useState('LIQUIDIUM•TOKEN');

  const [preSelectedAsset, setPreSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (preSelectedRune) {
      setSwapTabSelectedAsset(preSelectedRune);
    }
  }, [preSelectedRune]);

  const {
    connected,
    address,
    publicKey,
    paymentAddress,
    paymentPublicKey,
    signPsbt,
    signMessage,
  } = useSharedLaserEyes();

  const { btcPriceUsd, isBtcPriceLoading, btcPriceError } = useBtcPrice();

  // Fetch popular runes once - it's now a simple static list
  const togglePriceChart = React.useCallback(
    (assetName?: string, shouldToggle: boolean = true) => {
      if (activeTab === 'swap') {
        if (assetName) setSwapTabSelectedAsset(assetName);
        if (shouldToggle) setShowSwapTabPriceChart((prev) => !prev);
      } else if (activeTab === 'runesInfo') {
        if (assetName) setRunesInfoTabSelectedAsset(assetName);
        if (shouldToggle) setShowRunesInfoTabPriceChart((prev) => !prev);
      }
      // No price chart planned for Borrow tab in MVP
    },
    [activeTab],
  );

  useEffect(() => {
    const handleTabChangeEvent = (event: CustomEvent) => {
      const { tab, rune, asset } = event.detail as {
        tab: string;
        rune?: string;
        asset?: Asset;
      };
      if (tab === 'swap' && rune) {
        setSwapTabSelectedAsset(rune);
        if (showSwapTabPriceChart) {
          togglePriceChart(rune, false);
        }
      } else if (tab === 'swap' && asset) {
        setPreSelectedAsset(asset);
        setSwapTabSelectedAsset(asset.name);
        if (showSwapTabPriceChart) {
          togglePriceChart(asset.name, false);
        }
      }
      // Handle other tab changes if needed
    };
    window.addEventListener('tabChange', handleTabChangeEvent as EventListener);
    return () =>
      window.removeEventListener(
        'tabChange',
        handleTabChangeEvent as EventListener,
      );
  }, [showSwapTabPriceChart, togglePriceChart]);

  const isPriceChartVisible =
    (activeTab === 'swap' && showSwapTabPriceChart) ||
    (activeTab === 'runesInfo' && showRunesInfoTabPriceChart);

  const selectedAssetForActiveTab =
    activeTab === 'swap'
      ? swapTabSelectedAsset
      : activeTab === 'runesInfo'
        ? runesInfoTabSelectedAsset
        : ''; // No specific asset needed for borrow chart yet
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'swap':
        return (
          <SwapTab
            connected={connected}
            address={address}
            paymentAddress={paymentAddress}
            publicKey={publicKey}
            paymentPublicKey={paymentPublicKey}
            signPsbt={signPsbt}
            btcPriceUsd={btcPriceUsd}
            isBtcPriceLoading={isBtcPriceLoading}
            btcPriceError={btcPriceError}
            onShowPriceChart={togglePriceChart}
            showPriceChart={showSwapTabPriceChart}
            preSelectedRune={preSelectedRune}
            preSelectedAsset={preSelectedAsset}
          />
        );
      // --- Add Borrow Tab Case ---
      case 'borrow':
        return (
          <BorrowTab
            connected={connected}
            address={address}
            paymentAddress={paymentAddress} // Needed for prepare
            publicKey={publicKey} // Needed for prepare
            paymentPublicKey={paymentPublicKey} // Needed for prepare
            signPsbt={signPsbt} // Needed for submit
            signMessage={signMessage} // Needed for authentication
            btcPriceUsd={btcPriceUsd}
            isBtcPriceLoading={isBtcPriceLoading}
            btcPriceError={btcPriceError}
          />
        );
      // --- End Borrow Tab Case ---
      case 'runesInfo':
        return (
          <RunesInfoTab
            onShowPriceChart={togglePriceChart}
            showPriceChart={showRunesInfoTabPriceChart}
          />
        );
      case 'yourTxs':
        return <YourTxsTab connected={connected} address={address} />;
      case 'portfolio':
        return <PortfolioTab />;
      default:
        // Optionally render SwapTab as default or null
        return (
          <SwapTab
            connected={connected}
            address={address}
            paymentAddress={paymentAddress}
            publicKey={publicKey}
            paymentPublicKey={paymentPublicKey}
            signPsbt={signPsbt}
            btcPriceUsd={btcPriceUsd}
            isBtcPriceLoading={isBtcPriceLoading}
            btcPriceError={btcPriceError}
            onShowPriceChart={togglePriceChart}
            showPriceChart={showSwapTabPriceChart}
            preSelectedRune={preSelectedRune}
            preSelectedAsset={preSelectedAsset}
          />
        );
    }
  };

  return (
    <div
      className={`${styles.container} ${isPriceChartVisible ? styles.containerWithChart : ''}`}
    >
      {/* Conditionally render layout based on whether price chart is needed */}
      {activeTab === 'swap' || activeTab === 'runesInfo' ? (
        <div className={styles.appLayout}>
          <div className={styles.swapContainer}>{renderActiveTab()}</div>
          {isPriceChartVisible && (
            <div className={styles.priceChartContainer}>
              <PriceChart
                assetName={selectedAssetForActiveTab}
                onClose={() => togglePriceChart(undefined, true)} // Pass true to ensure toggle happens
                btcPriceUsd={btcPriceUsd}
              />
            </div>
          )}
        </div>
      ) : (
        // Render tabs like Borrow, YourTxs, Portfolio directly
        renderActiveTab()
      )}
    </div>
  );
}

export default AppInterface;
