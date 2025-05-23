import { useEffect, useState } from "react";
import { Asset } from "@/types/common";
import {
  fetchPopularFromApi,
  fetchBorrowQuotesFromApi,
  fetchBorrowRangesFromApi,
  LiquidiumBorrowQuoteOffer,
  LiquidiumBorrowQuoteResponse,
} from "@/lib/apiClient";
import { normalizeRuneName } from "@/utils/runeUtils";
import type { RuneData } from "@/lib/runesData";

interface UseBorrowQuotesArgs {
  collateralAsset: Asset | null;
  collateralAmount: string;
  address: string | null;
  collateralRuneInfo: RuneData | null;
}

export function useBorrowQuotes({
  collateralAsset,
  collateralAmount,
  address,
  collateralRuneInfo,
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

  // Fetch popular runes on mount
  useEffect(() => {
    const fetchPopular = async () => {
      setIsPopularLoading(true);
      setPopularError(null);
      setPopularRunes([]);
      try {
        const liquidiumToken: Asset = {
          id: "liquidiumtoken",
          name: "LIQUIDIUM•TOKEN",
          imageURI: "https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN",
          isBTC: false,
        };
        const response = await fetchPopularFromApi();
        let mappedRunes: Asset[] = [];
        if (!Array.isArray(response)) {
          mappedRunes = [liquidiumToken];
        } else {
          const fetchedRunes: Asset[] = response
            .map((collection: Record<string, unknown>) => ({
              id: (collection?.rune_id as string) || `unknown_${Math.random()}`,
              name: (
                (collection?.slug as string) ||
                (collection?.rune as string) ||
                "Unknown"
              ).replace(/-/g, "•"),
              imageURI:
                (collection?.icon_content_url_data as string) ||
                (collection?.imageURI as string),
              isBTC: false,
            }))
            .filter(
              (rune) =>
                rune.id !== liquidiumToken.id &&
                normalizeRuneName(rune.name) !==
                  normalizeRuneName(liquidiumToken.name),
            );
          mappedRunes = [liquidiumToken, ...fetchedRunes];
        }
        setPopularRunes(mappedRunes);
      } catch (error) {
        setPopularError(
          error instanceof Error
            ? error.message
            : "Failed to fetch popular runes",
        );
        const fallback: Asset = {
          id: "liquidiumtoken",
          name: "LIQUIDIUM•TOKEN",
          imageURI: "https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN",
          isBTC: false,
        };
        setPopularRunes([fallback]);
      } finally {
        setIsPopularLoading(false);
      }
    };
    fetchPopular();
  }, []);

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
        if (collateralRuneInfo?.id?.includes(":")) {
          runeIdForApi = collateralRuneInfo.id;
        }
        const result = await fetchBorrowRangesFromApi(runeIdForApi, address);
        if (result.success && result.data) {
          const { minAmount, maxAmount } = result.data;
          const decimals = collateralRuneInfo?.decimals ?? 0;
          const minFormatted = formatRuneAmount(minAmount, decimals);
          const maxFormatted = formatRuneAmount(maxAmount, decimals);
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
          errorMessage.includes("No valid ranges found") ||
          errorMessage.includes(
            "Could not find valid borrow ranges for this rune",
          )
        ) {
          setBorrowRangeError(
            "This rune is not currently available for borrowing on Liquidium.",
          );
        } else {
          setBorrowRangeError(null);
        }
      }
    };
    fetchMinMaxRange();
  }, [collateralAsset, address, collateralRuneInfo]);

  const formatRuneAmount = (rawAmount: string, decimals: number): string => {
    try {
      const rawAmountBigInt = BigInt(rawAmount);
      const divisorBigInt = BigInt(10 ** decimals);
      const scaledAmount = (rawAmountBigInt * BigInt(100)) / divisorBigInt;
      const scaledNumber = Number(scaledAmount) / 100;
      return scaledNumber.toFixed(decimals > 0 ? 2 : 0);
    } catch {
      return (Number(rawAmount) / 10 ** decimals).toFixed(decimals > 0 ? 2 : 0);
    }
  };

  const resetQuotes = () => {
    setQuotes([]);
    setSelectedQuoteId(null);
    setQuotesError(null);
  };

  const handleGetQuotes = async () => {
    if (!collateralAsset || !collateralAmount || !address) return;
    setIsQuotesLoading(true);
    resetQuotes();
    try {
      const decimals = collateralRuneInfo?.decimals ?? 0;
      let rawAmount: string;
      try {
        const amountFloat = parseFloat(collateralAmount);
        const amountInteger = Math.floor(
          amountFloat * 10 ** Math.min(8, decimals),
        );
        const multiplier = BigInt(10 ** Math.max(0, decimals - 8));
        const amountBigInt = BigInt(amountInteger) * multiplier;
        rawAmount = amountBigInt.toString();
      } catch {
        rawAmount = String(
          Math.floor(parseFloat(collateralAmount) * 10 ** decimals),
        );
      }

      let runeIdForApi = collateralAsset.id;
      if (collateralRuneInfo?.id?.includes(":")) {
        runeIdForApi = collateralRuneInfo.id;
      }

      const result: LiquidiumBorrowQuoteResponse =
        await fetchBorrowQuotesFromApi(runeIdForApi, rawAmount, address);

      if (result?.runeDetails) {
        if (result.runeDetails.valid_ranges?.rune_amount?.ranges?.length > 0) {
          const ranges = result.runeDetails.valid_ranges.rune_amount.ranges;
          let globalMin = BigInt(ranges[0].min);
          let globalMax = BigInt(ranges[0].max);
          for (let i = 1; i < ranges.length; i++) {
            const currentMin = BigInt(ranges[i].min);
            const currentMax = BigInt(ranges[i].max);
            if (currentMin < globalMin) globalMin = currentMin;
            if (currentMax > globalMax) globalMax = currentMax;
          }
          const minFormatted = formatRuneAmount(globalMin.toString(), decimals);
          const maxFormatted = formatRuneAmount(globalMax.toString(), decimals);
          setMinMaxRange(`Min: ${minFormatted} - Max: ${maxFormatted}`);
        } else {
          setMinMaxRange(null);
        }

        if (result.runeDetails.offers) {
          setQuotes(result.runeDetails.offers);
          if (result.runeDetails.offers.length === 0) {
            setQuotesError("No loan offers available for this amount.");
          }
        } else {
          setQuotes([]);
          setQuotesError("No loan offers found or invalid response.");
        }
      } else {
        setQuotes([]);
        setQuotesError("No loan offers found or invalid response.");
        setMinMaxRange(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch quotes.";
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
