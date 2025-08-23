import Big from 'big.js';
import { convertToRawAmount } from '@/utils/runeFormatting';
import { useEffect, useState } from 'react';
import {
  LiquidiumBorrowQuoteOffer,
  LiquidiumBorrowQuoteResponse,
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  fetchPopularFromApi,
} from '@/lib/api';
import type { RuneData } from '@/lib/runesData';
import { Asset } from '@/types/common';
import { mapPopularToAsset } from '@/utils/popularRunes';
import { formatRuneAmount } from '@/utils/runeFormatting';
import { safeArrayAccess, safeArrayFirst } from '@/utils/typeGuards';

interface UseBorrowQuotesArgs {
  collateralAsset: Asset | null;
  collateralAmount: string;
  address: string | null;
  collateralRuneInfo: RuneData | null;
  cachedPopularRunes?: Record<string, unknown>[];
  isPopularRunesLoading?: boolean;
  popularRunesError?: Error | null;
}

export function useBorrowQuotes({
  collateralAsset,
  collateralAmount,
  address,
  collateralRuneInfo,
  cachedPopularRunes,
  isPopularRunesLoading = false,
  popularRunesError = null,
}: UseBorrowQuotesArgs) {
  const [popularRunes, setPopularRunes] = useState<Asset[]>([]);
  const [isPopularLoading, setIsPopularLoading] = useState(false);
  const [popularError, setPopularError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<LiquidiumBorrowQuoteOffer[]>([]);
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [minMaxRange, setMinMaxRange] = useState<string | null>(null);
  const [borrowRangeError, setBorrowRangeError] = useState<string | null>(null);

  // Use cached popular runes directly; effect depends on the array reference

  // Fetch popular runes on mount or when cached data updates
  useEffect(() => {
    const fetchPopular = async () => {
      // Use external loading/error states directly instead of duplicating
      if (isPopularRunesLoading) {
        setIsPopularLoading(true);
        setPopularError(null);
        return;
      }

      if (popularRunesError) {
        setPopularError(popularRunesError.message);
        setIsPopularLoading(false);
        return;
      }

      setIsPopularLoading(true);
      setPopularError(null);

      try {
        // Try cached data first, then fetch if needed
        const runesData =
          cachedPopularRunes && cachedPopularRunes.length > 0
            ? cachedPopularRunes
            : await fetchPopularFromApi();

        // Convert to Asset format - LIQUIDIUM•TOKEN is already first in our list
        const mappedRunes = mapPopularToAsset(runesData);
        setPopularRunes(mappedRunes);
        setPopularError(null);
      } catch (error) {
        setPopularError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch popular runes',
        );
        setPopularRunes([]);
      } finally {
        setIsPopularLoading(false);
      }
    };
    fetchPopular();
  }, [cachedPopularRunes, isPopularRunesLoading, popularRunesError]);

  // Fetch min-max borrow range when collateral asset changes
  useEffect(() => {
    const fetchMinMaxRange = async () => {
      if (
        !collateralAsset ||
        !address ||
        collateralAsset.isBTC ||
        !collateralRuneInfo
      ) {
        setMinMaxRange(null);
        setBorrowRangeError(null);
        return;
      }
      try {
        let runeIdForApi = collateralAsset.id;
        if (collateralRuneInfo?.id?.includes(':')) {
          runeIdForApi = collateralRuneInfo.id;
        }
        const result = await fetchBorrowRangesFromApi(runeIdForApi, address);
        if (result.success && result.data) {
          const { minAmount, maxAmount, noOffersAvailable } = result.data;

          // Check if no offers are available for this rune
          if (noOffersAvailable || (minAmount === '0' && maxAmount === '0')) {
            setMinMaxRange(null);
            setBorrowRangeError(
              'There are currently no available loan offers for this Rune on Liquidium.',
            );
            return;
          }

          const decimals = collateralRuneInfo?.decimals ?? 0;
          const minFormatted = formatRuneAmount(minAmount, decimals, {
            maxDecimals: 2,
          });
          const maxFormatted = formatRuneAmount(maxAmount, decimals, {
            maxDecimals: 2,
          });
          setMinMaxRange(`Min: ${minFormatted} - Max: ${maxFormatted}`);
          setBorrowRangeError(null);
        } else {
          setMinMaxRange(null);
          setBorrowRangeError(null);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setMinMaxRange(null);
        if (
          errorMessage.includes('No valid ranges found') ||
          errorMessage.includes(
            'Could not find valid borrow ranges for this rune',
          ) ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('does not exist')
        ) {
          setBorrowRangeError(
            'This rune is not currently available for borrowing on Liquidium.',
          );
        } else {
          setBorrowRangeError(null);
        }
      }
    };
    fetchMinMaxRange();
  }, [collateralAsset, address, collateralRuneInfo]);

  const resetQuotes = () => {
    setQuotes([]);
    setSelectedQuoteId(null);
    setQuotesError(null);
  };

  const handleGetQuotes = async () => {
    if (!collateralAsset || !collateralAmount || !address) return;

    // Validate collateral amount using Big for precision
    try {
      const amountBig = new Big(collateralAmount);
      if (amountBig.lte(0)) {
        setQuotesError('Please enter a valid collateral amount.');
        return;
      }
    } catch {
      setQuotesError('Please enter a valid collateral amount.');
      return;
    }

    setIsQuotesLoading(true);
    resetQuotes();
    try {
      const decimals = collateralRuneInfo?.decimals ?? 0;
      // Use centralized helper to convert display amount to raw integer string
      const rawAmount = convertToRawAmount(collateralAmount, decimals);

      let runeIdForApi = collateralAsset.id;
      if (collateralRuneInfo?.id?.includes(':')) {
        runeIdForApi = collateralRuneInfo.id;
      }

      const result: LiquidiumBorrowQuoteResponse =
        await fetchBorrowQuotesFromApi(runeIdForApi, rawAmount, address);

      if (result?.runeDetails) {
        if (result.runeDetails.valid_ranges?.rune_amount?.ranges?.length > 0) {
          const ranges = result.runeDetails.valid_ranges.rune_amount.ranges;
          const firstRange = safeArrayFirst(ranges);
          if (firstRange) {
            let globalMin = BigInt(firstRange.min);
            let globalMax = BigInt(firstRange.max);
            for (let i = 1; i < ranges.length; i++) {
              const currentRange = safeArrayAccess(ranges, i);
              if (currentRange) {
                const currentMin = BigInt(currentRange.min);
                const currentMax = BigInt(currentRange.max);
                if (currentMin < globalMin) globalMin = currentMin;
                if (currentMax > globalMax) globalMax = currentMax;
              }
            }
            const minFormatted = formatRuneAmount(
              globalMin.toString(),
              decimals,
              { maxDecimals: 2 },
            );
            const maxFormatted = formatRuneAmount(
              globalMax.toString(),
              decimals,
              { maxDecimals: 2 },
            );
            setMinMaxRange(`Min: ${minFormatted} - Max: ${maxFormatted}`);
          }
        } else {
          setMinMaxRange(null);
        }

        if (result.runeDetails.offers) {
          setQuotes(result.runeDetails.offers);
          if (result.runeDetails.offers.length === 0) {
            setQuotesError('No loan offers available for this amount.');
          }
        } else {
          setQuotes([]);
          setQuotesError('No loan offers found or invalid response.');
        }
      } else {
        setQuotes([]);
        setQuotesError('No loan offers found or invalid response.');
        setMinMaxRange(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch quotes.';
      setQuotesError(errorMessage);
      setQuotes([]);
      setMinMaxRange(null);
    } finally {
      setIsQuotesLoading(false);
    }
  };

  return {
    popularRunes,
    isPopularLoading,
    popularError,
    quotes,
    isQuotesLoading,
    quotesError,
    selectedQuoteId,
    setSelectedQuoteId,
    minMaxRange,
    borrowRangeError,
    resetQuotes,
    handleGetQuotes,
  };
}

export default useBorrowQuotes;
