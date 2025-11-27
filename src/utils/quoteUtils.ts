import Big from 'big.js';
import type { QuoteResponse } from 'satsterminal-sdk';

import type { Asset } from '@/types/common';
import { sanitizeForBig } from '@/utils/formatters';

/**
 * Display strings for a quote, including formatted output amount and exchange rate.
 */
export interface QuoteDisplay {
  /** Formatted output amount string. */
  outputAmountDisplay: string;
  /** Formatted exchange rate string (e.g., "$1.23 per Rune"). */
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

    const formatBigWithTrim = (value: Big, maxFractionDigits: number) => {
      const fixed = value.toFixed(maxFractionDigits);
      if (!fixed.includes('.')) return fixed;
      return fixed.replace(/0+$/, '').replace(/\.$/, '') || '0';
    };

    const outputAmountDisplay = formatBigWithTrim(outputBig, 8);

    let exchangeRateDisplay: string | null = null;
    if (btcPriceUsd && btcValueBig.gt(0) && runeValueBig.gt(0)) {
      const btcUsdAmount = btcValueBig.times(btcPriceUsd);
      const pricePerRune = btcUsdAmount.div(runeValueBig);
      const pricePerRuneStr = pricePerRune.toFixed(6);
      const formatWithGrouping = (val: string) => {
        const [intPart, decPart] = val.split('.') as [string, string?];
        const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return decPart ? `${intWithCommas}.${decPart}` : intWithCommas;
      };
      const labelAsset =
        assetIn && !assetIn.isBTC ? assetIn.name : assetOut.name;
      exchangeRateDisplay = `$${formatWithGrouping(pricePerRuneStr)} per ${labelAsset}`;
    }

    return { outputAmountDisplay, exchangeRateDisplay };
  } catch {
    return {
      outputAmountDisplay: 'Error',
      exchangeRateDisplay: 'Error calculating rate',
    };
  }
}
