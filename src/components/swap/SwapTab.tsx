import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { type QuoteResponse } from 'satsterminal-sdk';

import { Loading } from '@/components/loading';
import { SwapTabForm, useSwapProcessManager } from '@/components/swap';
import styles from '@/components/swap/SwapTab.module.css';
import FeeSelector from '@/components/ui/FeeSelector';
// Import our new components
import { useRuneBalance } from '@/hooks/useRuneBalance';
import { useRuneBalances } from '@/hooks/useRuneBalances';
import { useRuneInfo } from '@/hooks/useRuneInfo';
import { useRuneMarketData } from '@/hooks/useRuneMarketData';
import useSwapAssets from '@/hooks/useSwapAssets';
import useSwapExecution from '@/hooks/useSwapExecution';
import useSwapQuote from '@/hooks/useSwapQuote';
import useSwapRunes from '@/hooks/useSwapRunes';
import useUsdValues from '@/hooks/useUsdValues';
import { fetchBtcBalanceFromApi } from '@/lib/api';
import type { Asset } from '@/types/common';
import { BTC_ASSET } from '@/types/common';
import { formatNumberWithLocale, formatSatsToBtc } from '@/utils/formatters';
import {
  calculateActualBalance,
  percentageOfRawAmount,
  percentageOfSatsToBtcString,
} from '@/utils/formatting';

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
  // New props for price chart
  onShowPriceChart?: (assetName?: string, shouldToggle?: boolean) => void;
  showPriceChart?: boolean;
  preSelectedRune?: string | null;
  preSelectedAsset?: Asset | null;
}

/**
 * Renders the swap tab UI for selecting assets, fetching quotes, and executing swaps.
 *
 * Manages local input/output amounts, selected assets, balance queries, quote fetching, and swap execution,
 * and passes computed state and handlers into the SwapTabForm component.
 *
 * @param connected - Whether the wallet is connected; enables balance and quote operations when true.
 * @param address - User's on-chain address used for rune balance and swap operations.
 * @param paymentAddress - User's BTC payment address used to fetch BTC balance.
 * @param publicKey - Public key used for swap-related operations that require on-chain identification.
 * @param paymentPublicKey - Payment public key used for BTC signing flow.
 * @param signPsbt - Async function that signs a PSBT (used during BTC swap execution).
 * @param btcPriceUsd - Current BTC price in USD used for USD value calculations.
 * @param isBtcPriceLoading - Whether the BTC price is currently loading.
 * @param btcPriceError - Error encountered while fetching BTC price, if any.
 * @param onShowPriceChart - Optional callback invoked to show or toggle the asset price chart.
 * @param showPriceChart - Optional flag to control initial visibility of the price chart.
 * @param preSelectedRune - Optional rune asset name to preselect in the UI.
 * @param preSelectedAsset - Optional Asset object to preselect in the UI.
 *
 * @returns The Swap tab React element configured with current state, handlers, and derived data.
 */
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
    preSelectedRune,
    preSelectedAsset,
    assetOut,
    setAssetIn,
    setAssetOut,
  });

  const availableRunes = popularRunes;
  const isLoadingRunes = isPopularLoading;
  const currentRunesError = popularError?.message || null;

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
  } = useRuneBalances(address, {
    enabled: !!connected && !!address,
    staleTime: 30000,
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

    let decimals = 8; // Default decimals for BTC

    if (assetIn.isBTC) {
      if (btcBalanceSats === undefined) {
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

    // BTC path: use shared helper for clarity and precision
    const formattedBtc = percentageOfSatsToBtcString(
      btcBalanceSats!,
      percentage,
    );
    setInputAmount(formattedBtc);
  };

  const availableBalanceNode = useMemo(() => {
    if (!connected || !assetIn) return null;
    if (assetIn.isBTC) {
      if (isBtcBalanceLoading)
        return <Loading variant="balance" className={styles.loadingText} />;
      if (btcBalanceError)
        return <span className={styles.errorText}>Error loading balance</span>;
      if (btcBalanceSats !== undefined) {
        const btcString = formatSatsToBtc(btcBalanceSats);
        return formatNumberWithLocale(parseFloat(btcString), {
          maximumFractionDigits: 8,
        });
      }
      return 'N/A';
    }

    if (isRuneBalancesLoading || isSwapRuneInfoLoading)
      return <Loading variant="balance" className={styles.loadingText} />;
    if (runeBalancesError || swapRuneInfoError)
      return <span className={styles.errorText}>Error loading balance</span>;

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
  }, [
    connected,
    assetIn,
    isBtcBalanceLoading,
    btcBalanceError,
    btcBalanceSats,
    isRuneBalancesLoading,
    isSwapRuneInfoLoading,
    runeBalancesError,
    swapRuneInfoError,
    inputRuneRawBalance,
    swapRuneInfo?.decimals,
  ]);

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
