import React, { lazy, useEffect, useState } from 'react';

import styles from '@/components/layout/AppInterface.module.css';
import type { ActiveTab } from '@/components/layout/TabNavigation';
import { useSharedLaserEyes } from '@/context/LaserEyesContext';
import useBtcPrice from '@/hooks/useBtcPrice';

const BorrowTab = lazy(() => import('@/components/borrow/BorrowTab'));

const PortfolioTab = lazy(() => import('@/components/portfolio/PortfolioTab'));

const PriceChart = lazy(() => import('@/components/charts/PriceChart'));

const RunesInfoTab = lazy(() => import('@/components/runes/RunesInfoTab'));

const SwapTab = lazy(() => import('@/components/swap/SwapTab'));

const YourTxsTab = lazy(() => import('@/components/portfolio/YourTxsTab'));

interface AppInterfaceProps {
  activeTab: ActiveTab;
  preSelectedRune?: string | null;
}

export function AppInterface({ activeTab, preSelectedRune = null }: AppInterfaceProps) {
  const [showSwapTabPriceChart, setShowSwapTabPriceChart] = useState(false);
  const [showRunesInfoTabPriceChart, setShowRunesInfoTabPriceChart] = useState(false);

  const [swapTabSelectedAsset, setSwapTabSelectedAsset] = useState(
    preSelectedRune || 'LIQUIDIUM•TOKEN',
  );
  const [runesInfoTabSelectedAsset, setRunesInfoTabSelectedAsset] = useState('LIQUIDIUM•TOKEN');

  useEffect(() => {
    if (preSelectedRune) {
      setSwapTabSelectedAsset(preSelectedRune);
    }
  }, [preSelectedRune]);

  const { connected, address, publicKey, paymentAddress, paymentPublicKey, signPsbt, signMessage } =
    useSharedLaserEyes();

  const { btcPriceUsd, isBtcPriceLoading, btcPriceError } = useBtcPrice();

  const togglePriceChart = React.useCallback(
    (assetName?: string, shouldToggle: boolean = true) => {
      if (activeTab === 'swap') {
        if (assetName) setSwapTabSelectedAsset(assetName);
        if (shouldToggle) setShowSwapTabPriceChart((prev) => !prev);
      } else if (activeTab === 'runesInfo') {
        if (assetName) setRunesInfoTabSelectedAsset(assetName);
        if (shouldToggle) setShowRunesInfoTabPriceChart((prev) => !prev);
      }
    },
    [activeTab],
  );

  const isPriceChartVisible =
    (activeTab === 'swap' && showSwapTabPriceChart) ||
    (activeTab === 'runesInfo' && showRunesInfoTabPriceChart);

  const selectedAssetForActiveTab =
    activeTab === 'swap'
      ? swapTabSelectedAsset
      : activeTab === 'runesInfo'
        ? runesInfoTabSelectedAsset
        : '';
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
          />
        );
      case 'borrow':
        return (
          <BorrowTab
            connected={connected}
            address={address}
            paymentAddress={paymentAddress}
            publicKey={publicKey}
            paymentPublicKey={paymentPublicKey}
            signPsbt={signPsbt}
            signMessage={signMessage}
          />
        );
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
    }
  };

  return (
    <div className={`${styles.container} ${isPriceChartVisible ? styles.containerWithChart : ''}`}>
      {activeTab === 'swap' || activeTab === 'runesInfo' ? (
        <div className={styles.appLayout}>
          <div className={styles.swapContainer}>{renderActiveTab()}</div>
          {isPriceChartVisible && (
            <div className={styles.priceChartContainer}>
              <PriceChart
                assetName={selectedAssetForActiveTab}
                onClose={() => togglePriceChart(undefined, true)}
                btcPriceUsd={btcPriceUsd}
              />
            </div>
          )}
        </div>
      ) : (
        renderActiveTab()
      )}
    </div>
  );
}
