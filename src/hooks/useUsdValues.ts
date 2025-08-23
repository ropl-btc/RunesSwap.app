import Big from 'big.js';
import { useMemo } from 'react';
import { QuoteResponse } from 'satsterminal-sdk';
import { Asset } from '@/types/common';
import { RuneMarketInfo as OrdiscanRuneMarketInfo } from '@/types/ordiscan';
import { sanitizeForBig } from '@/utils/formatters';

export interface UseUsdValuesArgs {
  inputAmount: string;
  outputAmount: string;
  assetIn: Asset | null;
  assetOut: Asset | null;
  btcPriceUsd: number | undefined;
  isBtcPriceLoading: boolean;
  btcPriceError: Error | null;
  quote: QuoteResponse | null;
  quoteError: string | null;
  inputRuneMarketInfo: OrdiscanRuneMarketInfo | null | undefined;
  outputRuneMarketInfo: OrdiscanRuneMarketInfo | null | undefined;
}

export default function useUsdValues({
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
}: UseUsdValuesArgs) {
  return useMemo(() => {
    if (!inputAmount || !assetIn || isBtcPriceLoading || btcPriceError) {
      return {
        inputUsdValue: null as string | null,
        outputUsdValue: null as string | null,
      };
    }

    try {
      const amountBig = new Big(sanitizeForBig(inputAmount));
      if (amountBig.lte(0)) {
        return { inputUsdValue: null, outputUsdValue: null };
      }

      let inputUsdVal: Big | null = null;
      if (assetIn.isBTC && btcPriceUsd) {
        inputUsdVal = amountBig.times(btcPriceUsd);
      } else if (!assetIn.isBTC && inputRuneMarketInfo) {
        inputUsdVal = amountBig.times(inputRuneMarketInfo.price_in_usd);
      } else if (
        !assetIn.isBTC &&
        quote &&
        quote.totalPrice &&
        btcPriceUsd &&
        !quoteError
      ) {
        const totalFormattedAmount = new Big(
          sanitizeForBig(quote.totalFormattedAmount),
        );
        const totalPrice = new Big(sanitizeForBig(quote.totalPrice));

        if (totalFormattedAmount.gt(0)) {
          const btcPerRune = totalPrice.div(totalFormattedAmount);
          inputUsdVal = amountBig.times(btcPerRune).times(btcPriceUsd);
        }
      }

      let outputUsdVal: Big | null = null;
      if (outputAmount && assetOut) {
        const outputAmountBig = new Big(sanitizeForBig(outputAmount));
        if (outputAmountBig.gt(0)) {
          if (assetOut.isBTC && btcPriceUsd) {
            outputUsdVal = outputAmountBig.times(btcPriceUsd);
          } else if (!assetOut.isBTC && outputRuneMarketInfo) {
            outputUsdVal = outputAmountBig.times(
              outputRuneMarketInfo.price_in_usd,
            );
          } else if (
            !assetOut.isBTC &&
            quote &&
            quote.totalPrice &&
            btcPriceUsd &&
            !quoteError
          ) {
            const totalFormattedAmount = new Big(
              sanitizeForBig(quote.totalFormattedAmount),
            );
            const totalPrice = new Big(sanitizeForBig(quote.totalPrice));

            if (totalFormattedAmount.gt(0)) {
              const btcPerRune = totalPrice.div(totalFormattedAmount);
              outputUsdVal = outputAmountBig
                .times(btcPerRune)
                .times(btcPriceUsd);
            }
          }
        }
      }

      const format = (v: Big | null) =>
        v !== null && v.gt(0)
          ? parseFloat(v.toFixed(2)).toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : null;

      return {
        inputUsdValue: format(inputUsdVal),
        outputUsdValue: format(outputUsdVal),
      };
    } catch {
      return { inputUsdValue: null, outputUsdValue: null };
    }
  }, [
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
  ]);
}
