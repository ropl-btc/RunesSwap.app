import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { type QuoteResponse } from 'satsterminal-sdk';

// Import our new components
import { useRuneBalance } from '@/hooks/useRuneBalance';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { useRuneMarketData } from '@/hooks/useRuneMarketData';
import useSwapAssets from '@/hooks/useSwapAssets';
import useSwapExecution from '@/hooks/useSwapExecution';
import useSwapQuote from '@/hooks/useSwapQuote';
import useSwapRunes from '@/hooks/useSwapRunes';
import useUsdValues from '@/hooks/useUsdValues';
import { fetchBtcBalanceFromApi, fetchRuneBalancesFromApi } from '@/lib/api';
import { Asset, BTC_ASSET } from '@/types/common';
import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';
import {
  formatAmountWithPrecision,
  percentageOfRawAmount,
} from '@/utils/amountFormatting';
import { formatNumberWithLocale } from '@/utils/formatters';
import { calculateActualBalance } from '@/utils/runeFormatting';
import { Loading } from '@/components/loading/Loading';
import FeeSelector from '../ui/FeeSelector';
import styles from './SwapTab.module.css';
import { SwapTabForm, useSwapProcessManager } from '.';

interface SwapTabProps {
  connected: boolean;
  address: string | null;
  paymentAddress: string | null;
  publicKey: string | null;
  paymentPublicKey: string | null;
  signPsbt: (
    tx: string,
    finalize?: boolean,
    broadcast?: boolean,
  ) => Promise<
    | {
        signedPsbtHex: string | undefined;
        signedPsbtBase64: string | undefined;
        txId?: string;
      }
    | undefined
  >;
  btcPriceUsd: number | undefined;
  isBtcPriceLoading: boolean;
  btcPriceError: Error | null;
  // New props for cached popular runes
  cachedPopularRunes?: Record<string, unknown>[];
  isPopularRunesLoading?: boolean;
  popularRunesError?: Error | null;
  // New props for price chart
  onShowPriceChart?: (assetName?: string, shouldToggle?: boolean) => void;
  showPriceChart?: boolean;
  preSelectedRune?: string | null;
  preSelectedAsset?: Asset | null;
}

export function SwapTab({
  connected,
  address,
  paymentAddress,
  publicKey,
  paymentPublicKey,
  signPsbt,
  btcPriceUsd,
  isBtcPriceLoading,
  btcPriceError,
  cachedPopularRunes = [],
  isPopularRunesLoading = false,
  popularRunesError = null,
  onShowPriceChart,
  showPriceChart = false,
  preSelectedRune = null,
  preSelectedAsset = null,
}: SwapTabProps) {
  // State for input/output amounts
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [feeRate, setFeeRate] = useState(0);

  // State for selected assets
  const [assetIn, setAssetIn] = useState<Asset>(BTC_ASSET);
  const [assetOut, setAssetOut] = useState<Asset | null>(null);

  const {
    popularRunes,
    isPopularLoading,
    popularError,
    isPreselectedRuneLoading,
  } = useSwapRunes({
    cachedPopularRunes,
    isPopularRunesLoading,
    popularRunesError,
    preSelectedRune,
    preSelectedAsset,
    assetOut,
    setAssetIn,
    setAssetOut,
  });

  const availableRunes = popularRunes;
  const isLoadingRunes = isPopularLoading;
  const currentRunesError = popularError;

  // Add back loadingDots state for animation
  const [loadingDots, setLoadingDots] = useState('.');
  // Add back quote, quoteError, quoteExpired for quote data and error
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteTimestamp, setQuoteTimestamp] = useState<number | null>(null);

  // --- Swap process state (reducer) ---
  const { swapState, dispatchSwap } = useSwapProcessManager({
    connected,
    address,
  });

  // Use reducer state for quoteError and quoteExpired
  const quoteError = swapState.quoteError;
  const quoteExpired = swapState.quoteExpired;

  // State for calculated prices
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);

  const { handleSelectAssetIn, handleSelectAssetOut, handleSwapDirection } =
    useSwapAssets({
      popularRunes,
      showPriceChart,
      onShowPriceChart,
      dispatchSwap,
      setQuote,
      setExchangeRate,
      setInputAmount,
      setOutputAmount,
      inputAmount,
      outputAmount,
      assetIn,
      assetOut,
      setAssetIn,
      setAssetOut,
    });

  // Ordiscan Balance Queries
  const {
    data: btcBalanceSats,
    isLoading: isBtcBalanceLoading,
    error: btcBalanceError,
  } = useQuery<number, Error>({
    queryKey: ['btcBalance', paymentAddress], // Include address in key
    queryFn: () => fetchBtcBalanceFromApi(paymentAddress!), // Use API function
    enabled: !!connected && !!paymentAddress, // Only run query if connected and address exists
    staleTime: 30000, // Consider balance stale after 30 seconds
  });

  const {
    data: runeBalances,
    isLoading: isRuneBalancesLoading,
    error: runeBalancesError,
  } = useQuery<OrdiscanRuneBalance[], Error>({
    queryKey: ['runeBalancesApi', address],
    queryFn: () => fetchRuneBalancesFromApi(address!), // Use API function
    enabled: !!connected && !!address, // Only run query if connected and address exists
    staleTime: 30000, // Consider balances stale after 30 seconds
  });

  // Use shared hook for Input Rune Info
  const {
    data: swapRuneInfo,
    isLoading: isSwapRuneInfoLoading,
    error: swapRuneInfoError,
  } = useRuneInfo(assetIn?.isBTC ? null : assetIn?.name, {
    enabled: !!assetIn && !assetIn.isBTC && !!assetIn.name,
  });

  // Use shared hooks for market data
  const { data: inputRuneMarketInfo } = useRuneMarketData(
    assetIn?.isBTC ? null : assetIn?.name,
    {
      enabled: !!assetIn && !assetIn.isBTC,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: outputRuneMarketInfo } = useRuneMarketData(
    assetOut?.isBTC ? null : assetOut?.name,
    {
      enabled: !!assetOut && !assetOut.isBTC,
      staleTime: 5 * 60 * 1000,
    },
  );

  // Compute input rune raw balance at top level to follow Rules of Hooks
  const inputRuneRawBalance = useRuneBalance(assetIn?.name, runeBalances);

  const { inputUsdValue, outputUsdValue } = useUsdValues({
    inputAmount,
    outputAmount,
    assetIn,
    assetOut,
    btcPriceUsd,
    isBtcPriceLoading,
    btcPriceError,
    quote,
    quoteError,
    inputRuneMarketInfo,
    outputRuneMarketInfo,
  });

  // Effect for loading dots animation (with proper cycling animation)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isBtcPriceLoading || swapState.isQuoteLoading || swapState.isSwapping) {
      // Create animated dots that cycle through [.,..,...] pattern
      intervalId = setInterval(() => {
        setLoadingDots((dots) => {
          switch (dots) {
            case '.':
              return '..';
            case '..':
              return '...';
            default:
              return '.'; // Reset to single dot
          }
        });
      }, 400); // Update every 400ms for smoother animation
    } else {
      setLoadingDots('.'); // Reset when not loading
    }

    // Cleanup function to clear interval
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isBtcPriceLoading, swapState.isQuoteLoading, swapState.isSwapping]);

  // Search functionality handled by AssetSelector component

  const {
    handleFetchQuote,
    debouncedInputAmount,
    quoteKeyRef,
    isThrottledRef,
  } = useSwapQuote({
    inputAmount,
    assetIn,
    assetOut,
    address,
    btcPriceUsd,
    swapState,
    dispatchSwap,
    quote,
    setQuote,
    outputAmount,
    setOutputAmount,
    exchangeRate,
    setExchangeRate,
    setQuoteTimestamp,
  });

  const { handleSwap } = useSwapExecution({
    connected,
    address,
    paymentAddress,
    publicKey,
    paymentPublicKey,
    signPsbt,
    assetIn,
    assetOut,
    quote,
    quoteTimestamp,
    swapState,
    dispatchSwap,
    isThrottledRef,
    quoteKeyRef,
    selectedFeeRate: feeRate,
  });

  // Add balance percentage helper functions
  const handlePercentageClick = (percentage: number) => {
    if (!connected || !assetIn) return;

    let availableBalance = 0;
    let decimals = 8; // Default decimals for BTC

    if (assetIn.isBTC) {
      if (btcBalanceSats !== undefined) {
        availableBalance = btcBalanceSats / 100_000_000;
      } else {
        return; // No balance available
      }
    } else {
      const rawBalance = inputRuneRawBalance;
      if (rawBalance === null) return;
      try {
        decimals = swapRuneInfo?.decimals ?? 0;
        const formattedAmount = percentageOfRawAmount(
          rawBalance,
          decimals,
          percentage,
        );
        setInputAmount(formattedAmount);
        return;
      } catch {
        return;
      }
    }

    // BTC path: Calculate percentage of available BTC balance
    const newAmount =
      percentage === 1 ? availableBalance : availableBalance * percentage;
    const formattedAmount = formatAmountWithPrecision(newAmount, decimals);
    setInputAmount(formattedAmount);
  };

  const availableBalanceNode =
    connected && assetIn ? (
      assetIn.isBTC ? (
        isBtcBalanceLoading ? (
          <Loading variant="balance" className={styles.loadingText} />
        ) : btcBalanceError ? (
          <span className={styles.errorText}>Error loading balance</span>
        ) : btcBalanceSats !== undefined ? (
          `${formatNumberWithLocale(btcBalanceSats / 100_000_000, { maximumFractionDigits: 8 })}`
        ) : (
          'N/A'
        )
      ) : isRuneBalancesLoading || isSwapRuneInfoLoading ? (
        <Loading variant="balance" className={styles.loadingText} />
      ) : runeBalancesError || swapRuneInfoError ? (
        <span className={styles.errorText}>Error loading balance</span>
      ) : (
        (() => {
          const rawBalance = inputRuneRawBalance;
          if (rawBalance === null) return 'N/A';
          try {
            const balanceNum = parseFloat(rawBalance);
            if (isNaN(balanceNum)) return 'Invalid Balance';
            const decimals = swapRuneInfo?.decimals ?? 0;
            const displayValue = calculateActualBalance(rawBalance, decimals);
            return `${formatNumberWithLocale(displayValue, { maximumFractionDigits: decimals })}`;
          } catch {
            return 'Formatting Error';
          }
        })()
      )
    ) : null;

  return (
    <SwapTabForm
      connected={connected}
      assetIn={assetIn}
      assetOut={assetOut}
      inputAmount={inputAmount}
      outputAmount={outputAmount}
      onInputAmountChange={setInputAmount}
      onSelectAssetIn={handleSelectAssetIn}
      onSelectAssetOut={handleSelectAssetOut}
      onSwapDirection={handleSwapDirection}
      onPercentageClick={handlePercentageClick}
      availableRunes={availableRunes}
      isLoadingRunes={isLoadingRunes}
      currentRunesError={currentRunesError}
      availableBalanceNode={availableBalanceNode}
      inputUsdValue={inputUsdValue}
      outputUsdValue={outputUsdValue}
      exchangeRate={exchangeRate}
      isQuoteLoading={swapState.isQuoteLoading}
      isSwapping={swapState.isSwapping}
      quoteError={quoteError}
      swapError={swapState.swapError}
      quote={quote}
      quoteExpired={quoteExpired}
      swapStep={swapState.swapStep}
      txId={swapState.txId}
      loadingDots={loadingDots}
      onFetchQuote={handleFetchQuote}
      onSwap={handleSwap}
      debouncedInputAmount={debouncedInputAmount}
      showPriceChart={showPriceChart}
      onShowPriceChart={onShowPriceChart}
      isPreselectedRuneLoading={isPreselectedRuneLoading}
      feeSelector={
        quote && !quoteError ? (
          <FeeSelector
            onChange={setFeeRate}
            availableOptions={['medium', 'fast', 'custom']}
          />
        ) : null
      }
    />
  );
}

export default SwapTab;
