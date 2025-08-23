import { useCallback, useEffect, useRef } from 'react';
import { type QuoteResponse } from 'satsterminal-sdk';
import { useDebounce } from 'use-debounce';
import type {
  SwapProcessAction,
  SwapProcessState,
} from '@/components/swap/SwapProcessManager';
import { fetchQuoteFromApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Asset } from '@/types/common';
import { sanitizeNumberString } from '@/utils/formatters';

const MOCK_ADDRESS = '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo';

interface UseSwapQuoteArgs {
  inputAmount: string;
  assetIn: Asset | null;
  assetOut: Asset | null;
  address: string | null;
  btcPriceUsd: number | undefined;
  swapState: SwapProcessState;
  dispatchSwap: React.Dispatch<SwapProcessAction>;
  quote: QuoteResponse | null;
  setQuote: React.Dispatch<React.SetStateAction<QuoteResponse | null>>;
  outputAmount: string;
  setOutputAmount: React.Dispatch<React.SetStateAction<string>>;
  exchangeRate: string | null;
  setExchangeRate: React.Dispatch<React.SetStateAction<string | null>>;
  setQuoteTimestamp: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useSwapQuote({
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
}: UseSwapQuoteArgs) {
  const [debouncedInputAmount] = useDebounce(
    inputAmount ? parseFloat(inputAmount) : 0,
    1500,
  );

  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isThrottledRef = useRef(false);
  const lastResetTimestampRef = useRef<number | null>(null);
  const quoteKeyRef = useRef<string>('');
  const latestQuoteRequestId = useRef(0);

  const handleFetchQuote = useCallback(async () => {
    if (!inputAmount || !parseFloat(inputAmount) || !assetIn || !assetOut) {
      return;
    }

    const amount = parseFloat(inputAmount);

    if (isThrottledRef.current) {
      return;
    }

    isThrottledRef.current = true;
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    throttleTimerRef.current = setTimeout(() => {
      isThrottledRef.current = false;
    }, 3000);

    const requestId = ++latestQuoteRequestId.current;
    dispatchSwap({ type: 'FETCH_QUOTE_START' });
    setOutputAmount('');
    setQuote(null);
    setExchangeRate(null);

    const effectiveAddress = address || MOCK_ADDRESS;
    if (!effectiveAddress) {
      dispatchSwap({
        type: 'FETCH_QUOTE_ERROR',
        error: 'Internal error: Missing address for quote.',
      });
      return;
    }

    if (amount <= 0) {
      setOutputAmount('0.0');
      dispatchSwap({ type: 'FETCH_QUOTE_SUCCESS' });
      return;
    }

    try {
      if (
        (assetIn?.isBTC && assetOut?.isBTC) ||
        (!assetIn?.isBTC && !assetOut?.isBTC)
      ) {
        dispatchSwap({
          type: 'FETCH_QUOTE_ERROR',
          error: 'Invalid asset pair selected.',
        });
        return;
      }
      const runeName = assetIn.isBTC ? assetOut.name : assetIn.name;
      const isSell = !assetIn.isBTC;

      const params = {
        btcAmount: amount,
        runeName,
        address: effectiveAddress,
        sell: isSell,
      };

      // Single attempt to avoid doubling upstream load on transient errors
      const quoteResponse = await fetchQuoteFromApi(params);

      if (requestId === latestQuoteRequestId.current) {
        setQuote(quoteResponse ?? null);
        setQuoteTimestamp(Date.now());
        let calculatedOutputAmount = '';
        let calculatedRate: string | null = null;
        if (quoteResponse) {
          const inputVal = parseFloat(inputAmount);
          let outputVal = 0;
          let btcValue = 0;
          let runeValue = 0;
          try {
            if (assetIn?.isBTC) {
              outputVal = parseFloat(
                sanitizeNumberString(quoteResponse.totalFormattedAmount || '0'),
              );
              btcValue = inputVal;
              runeValue = outputVal;
              calculatedOutputAmount = outputVal.toLocaleString(undefined, {});
            } else {
              outputVal = parseFloat(
                sanitizeNumberString(quoteResponse.totalPrice || '0'),
              );
              runeValue = inputVal;
              btcValue = outputVal;
              calculatedOutputAmount = outputVal.toLocaleString(undefined, {
                maximumFractionDigits: 8,
              });
            }
            if (btcValue > 0 && runeValue > 0 && btcPriceUsd) {
              const btcUsdAmount = btcValue * btcPriceUsd;
              const pricePerRune = btcUsdAmount / runeValue;
              calculatedRate = `${pricePerRune.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })} per ${
                assetIn && !assetIn.isBTC ? assetIn.name : assetOut?.name
              }`;
            }
            setExchangeRate(calculatedRate);
          } catch {
            calculatedOutputAmount = 'Error';
            setExchangeRate('Error calculating rate');
          }
        }
        setOutputAmount(calculatedOutputAmount);
        dispatchSwap({ type: 'FETCH_QUOTE_SUCCESS' });
      }
    } catch (err) {
      if (requestId === latestQuoteRequestId.current) {
        let errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch quote';

        if (
          errorMessage.includes('500') ||
          errorMessage.includes('Internal Server Error')
        ) {
          errorMessage =
            'Server error: The quote service is temporarily unavailable. Please try again later.';
        } else if (errorMessage.includes('No valid orders')) {
          errorMessage =
            'No orders available for this trade. Try a different amount or rune.';
        } else if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('network')
        ) {
          errorMessage =
            'Network error: Please check your connection and try again.';
        }

        logger.error(
          'API Error in fetchQuote',
          {
            operation: 'fetchQuote',
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            errorMessage,
          },
          'API',
        );

        dispatchSwap({
          type: 'FETCH_QUOTE_ERROR',
          error: errorMessage,
        });
      }
    }
  }, [
    assetIn,
    assetOut,
    inputAmount,
    address,
    btcPriceUsd,
    dispatchSwap,
    setQuote,
    setExchangeRate,
    setOutputAmount,
    setQuoteTimestamp,
  ]);

  useEffect(() => {
    if (swapState.txId || swapState.swapStep === 'success') {
      return;
    }

    const runeAsset = assetIn?.isBTC ? assetOut : assetIn;
    const hasValidInputAmount =
      typeof debouncedInputAmount === 'number' && debouncedInputAmount > 0;
    const hasValidAssets =
      !!assetIn &&
      !!assetOut &&
      !!runeAsset &&
      typeof assetIn.id === 'string' &&
      typeof assetOut.id === 'string' &&
      !runeAsset.isBTC;

    const currentKey =
      hasValidInputAmount && hasValidAssets
        ? `${debouncedInputAmount}-${assetIn.id}-${assetOut.id}`
        : '';

    if (
      hasValidInputAmount &&
      hasValidAssets &&
      currentKey !== quoteKeyRef.current
    ) {
      // If the parameters changed, clear throttle to allow immediate fetching
      // This fixes the issue where changing input amount while loading doesn't update
      if (isThrottledRef.current) {
        isThrottledRef.current = false;
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
      }

      if (!isThrottledRef.current) {
        handleFetchQuote();
        quoteKeyRef.current = currentKey;
      }
    }

    if (!hasValidInputAmount || !hasValidAssets) {
      if (swapState.isSwapping) {
        return;
      }

      if (quote || outputAmount || exchangeRate) {
        setQuote(null);
        setOutputAmount('');
        setExchangeRate(null);
      }

      if (
        (!debouncedInputAmount || debouncedInputAmount === 0) &&
        ![
          'success',
          'confirming',
          'signing',
          'getting_psbt',
          'fetching_quote',
        ].includes(swapState.swapStep) &&
        !swapState.isSwapping &&
        quoteKeyRef.current !== ''
      ) {
        const currentTime = Date.now();
        const RESET_COOLDOWN = 5000;

        if (
          !lastResetTimestampRef.current ||
          currentTime - lastResetTimestampRef.current > RESET_COOLDOWN
        ) {
          dispatchSwap({ type: 'RESET_SWAP' });
          lastResetTimestampRef.current = currentTime;
          quoteKeyRef.current = '';
        }
      }
    }
  }, [
    debouncedInputAmount,
    assetIn,
    assetOut,
    swapState.txId,
    swapState.swapStep,
    swapState.isSwapping,
    dispatchSwap,
    handleFetchQuote,
    quote,
    outputAmount,
    exchangeRate,
    setQuote,
    setOutputAmount,
    setExchangeRate,
  ]);

  useEffect(() => {
    if (swapState.quoteExpired) {
      setQuoteTimestamp(null);
    }
  }, [swapState.quoteExpired, setQuoteTimestamp]);

  return {
    handleFetchQuote,
    debouncedInputAmount,
    quoteKeyRef,
    isThrottledRef,
  };
}

export default useSwapQuote;
