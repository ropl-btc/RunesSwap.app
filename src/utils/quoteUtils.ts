import Big from 'big.js';
import type { QuoteResponse } from 'satsterminal-sdk';

import type { Asset } from '@/types/common';
import { sanitizeForBig } from '@/utils/formatters';

export interface QuoteDisplay {
  outputAmountDisplay: string;
  exchangeRateDisplay: string | null;
}

/**
 * Computes user-facing output amount and USD rate display strings from a quote.
 * Keeps all math in Big.js, returns safe display strings.
 */
export function computeQuoteDisplay(params: {
  inputAmount: string;
  assetIn: Asset | null;
  assetOut: Asset | null;
  quote: QuoteResponse | null | undefined;
  btcPriceUsd: number | undefined;
}): QuoteDisplay {
  const { inputAmount, assetIn, assetOut, quote, btcPriceUsd } = params;
  if (!quote || !assetIn || !assetOut) {
    return { outputAmountDisplay: '', exchangeRateDisplay: null };
  }

  try {
    const inputBig = new Big(sanitizeForBig(inputAmount));
    let outputBig = new Big(0);
    let btcValueBig = new Big(0);
    let runeValueBig = new Big(0);

    if (assetIn.isBTC) {
      const parsedOutputBig = new Big(
        sanitizeForBig(quote.totalFormattedAmount || '0'),
      );
      if (parsedOutputBig.lte(0))
        throw new Error('Invalid quote output amount');
      outputBig = parsedOutputBig; // rune quantity
      btcValueBig = inputBig;
      runeValueBig = outputBig;
    } else {
      const parsedPriceBig = new Big(sanitizeForBig(quote.totalPrice || '0'));
      if (parsedPriceBig.lte(0)) throw new Error('Invalid quote price');
      outputBig = parsedPriceBig; // BTC amount
      runeValueBig = inputBig;
      btcValueBig = outputBig;
    }

    const outputAmountDisplay = assetIn.isBTC
      ? Number(outputBig.toString()).toLocaleString(undefined, {})
      : Number(outputBig.toString()).toLocaleString(undefined, {
          maximumFractionDigits: 8,
        });

    let exchangeRateDisplay: string | null = null;
    if (btcPriceUsd && btcValueBig.gt(0) && runeValueBig.gt(0)) {
      const btcUsdAmount = btcValueBig.times(btcPriceUsd);
      const pricePerRune = btcUsdAmount.div(runeValueBig);
      const pricePerRuneNum = Number(pricePerRune.toFixed(6));
      const labelAsset =
        assetIn && !assetIn.isBTC ? assetIn.name : assetOut.name;
      exchangeRateDisplay = `${pricePerRuneNum.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })} per ${labelAsset}`;
    }

    return { outputAmountDisplay, exchangeRateDisplay };
  } catch {
    return {
      outputAmountDisplay: 'Error',
      exchangeRateDisplay: 'Error calculating rate',
    };
  }
}
