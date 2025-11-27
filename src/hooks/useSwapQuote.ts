import Big from 'big.js';
import { useCallback, useEffect, useRef } from 'react';
import { type QuoteResponse } from 'satsterminal-sdk';
import { useDebounce } from 'use-debounce';

import type {
  SwapProcessAction,
  SwapProcessState,
} from '@/components/swap/SwapProcessManager';
import { fetchQuoteFromApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import type { Asset } from '@/types/common';
import { parseAmount, sanitizeForBig } from '@/utils/formatting';
import { computeQuoteDisplay } from '@/utils/quoteUtils';

const MOCK_ADDRESS = process.env.NEXT_PUBLIC_QUOTE_MOCK_ADDRESS;
const DEFAULT_READONLY_ADDRESS = '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo';

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

/**
 * Manages debounced, throttled fetching of swap quotes and updates related state and displays.
 *
 * @param inputAmount - User-entered input amount string used to request quotes.
 * @param assetIn - Asset being sent (may be BTC).
 * @param assetOut - Asset being received (may be BTC).
 * @param address - Optional user address; a mock or default read-only address will be used if not provided.
 * @param btcPriceUsd - Optional Bitcoin price in USD used to compute display values.
 * @param swapState - Current swap process state used to gate quoting and reset behavior.
 * @param dispatchSwap - Dispatch function for swap process actions (e.g., start, success, error, reset).
 * @param quote - Current quote response (nullable).
 * @param setQuote - Setter for the current quote response.
 * @param outputAmount - Current displayed output amount string.
 * @param setOutputAmount - Setter for the displayed output amount.
 * @param exchangeRate - Current displayed exchange rate string.
 * @param setExchangeRate - Setter for the displayed exchange rate.
 * @param setQuoteTimestamp - Setter for the quote timestamp (used to mark when a quote was obtained).
 * @returns An object with:
 *   - handleFetchQuote: function to trigger a quote fetch immediately,
 *   - debouncedInputAmount: input amount after debounce,
 *   - quoteKeyRef: ref containing the current quote key used to avoid redundant fetches,
 *   - isThrottledRef: ref boolean indicating whether quote requests are currently throttled.
 */
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
  // Parse for debouncing using centralized helper
  const parsedInput = parseAmount(inputAmount) || 0;
  const [debouncedInputAmount] = useDebounce(
    parsedInput > 0 ? parsedInput : 0,
    1500,
  );

  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isThrottledRef = useRef(false);
  const lastResetTimestampRef = useRef<number | null>(null);
  const quoteKeyRef = useRef<string>('');
  const latestQuoteRequestId = useRef(0);

  const handleFetchQuote = useCallback(async () => {
    // Use centralized helper for input amount
    const amount = parseAmount(inputAmount);
    if (!inputAmount || amount <= 0 || !assetIn || !assetOut) {
      return;
    }

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
    // Allow quotes without connection by using an optional mock address or a default read-only address
    const effectiveAddress =
      address ||
      (MOCK_ADDRESS ? String(MOCK_ADDRESS) : undefined) ||
      DEFAULT_READONLY_ADDRESS;

    dispatchSwap({ type: 'FETCH_QUOTE_START' });
    setOutputAmount('');
    setQuote(null);
    setExchangeRate(null);

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
        // Ensure BTC amount is a fixed 8-decimal string to avoid exponential notation.
        // For non-BTC inputs, pass a sanitized string representation to avoid float issues.
        btcAmount: assetIn.isBTC
          ? new Big(sanitizeForBig(inputAmount)).toFixed(8)
          : sanitizeForBig(inputAmount),
        runeName,
        address: effectiveAddress,
        sell: isSell,
      };

      // Single attempt to avoid doubling upstream load on transient errors
      const quoteResponse = await fetchQuoteFromApi(params);

      if (requestId === latestQuoteRequestId.current) {
        setQuote(quoteResponse ?? null);
        setQuoteTimestamp(Date.now());
        const { outputAmountDisplay, exchangeRateDisplay } =
          computeQuoteDisplay({
            inputAmount,
            assetIn,
            assetOut,
            quote: quoteResponse,
            btcPriceUsd,
          });
        setOutputAmount(outputAmountDisplay);
        setExchangeRate(exchangeRateDisplay);
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

    // Allow pre-connection quotes when a mock or default read-only address is available
    const addressKey = address || (MOCK_ADDRESS ? 'mock' : 'default');
    const currentKey =
      hasValidInputAmount && hasValidAssets
        ? `${debouncedInputAmount}-${assetIn.id}-${assetOut.id}-${addressKey}`
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
    assetIn?.id,
    assetIn?.isBTC,
    assetOut?.id,
    assetOut?.isBTC,
    address,
    swapState.txId,
    swapState.swapStep,
    swapState.isSwapping,
    dispatchSwap,
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
