import { useEffect, useRef, useState } from 'react';
import { fetchPopularFromApi, fetchRunesFromApi } from '@/lib/api';
import { Asset, BTC_ASSET } from '@/types/common';
import { mapPopularToAsset } from '@/utils/popularRunes';
import { normalizeRuneName, getRuneIconUrl } from '@/utils/runeUtils';
import { safeArrayFirst } from '@/utils/typeGuards';

interface UseSwapRunesArgs {
  cachedPopularRunes?: Record<string, unknown>[];
  isPopularRunesLoading?: boolean;
  popularRunesError?: Error | null;
  preSelectedRune?: string | null;
  preSelectedAsset?: Asset | null;
  assetOut: Asset | null;
  setAssetIn: React.Dispatch<React.SetStateAction<Asset>>;
  setAssetOut: React.Dispatch<React.SetStateAction<Asset | null>>;
}

export function useSwapRunes({
  cachedPopularRunes = [],
  isPopularRunesLoading = false,
  popularRunesError = null,
  preSelectedRune = null,
  preSelectedAsset = null,
  assetOut,
  setAssetIn,
  setAssetOut,
}: UseSwapRunesArgs) {
  const [popularRunes, setPopularRunes] = useState<Asset[]>([]);
  const [isPopularLoading, setIsPopularLoading] = useState(
    isPopularRunesLoading,
  );
  const [popularError, setPopularError] = useState<string | null>(
    popularRunesError ? popularRunesError.message : null,
  );
  const [isPreselectedRuneLoading, setIsPreselectedRuneLoading] =
    useState(!!preSelectedRune);
  const [hasLoadedPreselectedRune, setHasLoadedPreselectedRune] =
    useState(false);
  const hasLoadedPopularRunes = useRef(false);

  useEffect(() => {
    if (preSelectedAsset && !hasLoadedPreselectedRune) {
      setAssetIn(BTC_ASSET);
      setAssetOut(preSelectedAsset);
      setIsPreselectedRuneLoading(false);
      setHasLoadedPreselectedRune(true);
      setPopularRunes((prev) => {
        const exists = prev.some((r) => r.id === preSelectedAsset.id);
        return exists ? prev : [preSelectedAsset, ...prev];
      });
    }
  }, [preSelectedAsset, setAssetIn, setAssetOut, hasLoadedPreselectedRune]);

  useEffect(() => {
    const fetchPopular = async () => {
      if (hasLoadedPopularRunes.current) return;

      // Try cached data first, then fetch if needed
      const runesData =
        cachedPopularRunes && cachedPopularRunes.length > 0
          ? cachedPopularRunes
          : await fetchPopularFromApi();

      // Convert to Asset format - LIQUIDIUM•TOKEN is already first in our list
      let mappedRunes: Asset[] = mapPopularToAsset(runesData);

      // Add preselected asset if it's not in the list
      if (preSelectedAsset) {
        const exists = mappedRunes.some((r) => r.id === preSelectedAsset.id);
        if (!exists) {
          mappedRunes = [preSelectedAsset, ...mappedRunes];
        }
      }

      setPopularRunes(mappedRunes);

      // Set first rune as output if no preselection and no current output
      if (!preSelectedRune && !assetOut && mappedRunes.length > 0) {
        const firstRune = safeArrayFirst(mappedRunes);
        if (firstRune) {
          setAssetOut(firstRune);
        }
      }

      setIsPopularLoading(false);
      hasLoadedPopularRunes.current = true;
    };

    fetchPopular().catch((error) => {
      setPopularError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch popular runes',
      );
      setIsPopularLoading(false);
    });
  }, [
    cachedPopularRunes,
    preSelectedRune,
    preSelectedAsset,
    assetOut,
    setAssetOut,
  ]);

  useEffect(() => {
    const findAndSelectRune = async () => {
      if (preSelectedRune && !hasLoadedPreselectedRune) {
        setIsPreselectedRuneLoading(true);
        const normalized = normalizeRuneName(preSelectedRune);
        let rune = popularRunes.find(
          (r) => normalizeRuneName(r.name) === normalized,
        );

        if (!rune) {
          const provisionalAsset: Asset = {
            id: normalized.toLowerCase(),
            name: preSelectedRune,
            imageURI: getRuneIconUrl(preSelectedRune),
            isBTC: false,
          };
          setAssetIn(BTC_ASSET);
          setAssetOut(provisionalAsset);
          rune = provisionalAsset;
        }

        if (rune) {
          setAssetIn(BTC_ASSET);
          setAssetOut(rune);
          setIsPreselectedRuneLoading(false);
          setHasLoadedPreselectedRune(true);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('rune');
            window.history.replaceState({}, '', url.toString());
          }
        } else {
          try {
            const searchResults = await fetchRunesFromApi(preSelectedRune);
            if (searchResults && searchResults.length > 0) {
              const matchingRune = searchResults.find(
                (r) => normalizeRuneName(r.name) === normalized,
              );
              const foundRune = matchingRune || safeArrayFirst(searchResults);
              if (foundRune) {
                const foundAsset: Asset = {
                  id: foundRune.id,
                  name: foundRune.name,
                  imageURI: foundRune.imageURI,
                  isBTC: false,
                };
                setAssetIn(BTC_ASSET);
                setAssetOut(foundAsset);
              }
            }
          } catch {
            // If still not selected, fall back to creating a basic Asset so the UI switches pairs.
            if (!assetOut) {
              const fallbackAsset: Asset = {
                id: normalized.toLowerCase(),
                name: preSelectedRune,
                imageURI: getRuneIconUrl(preSelectedRune),
                isBTC: false,
              };
              setAssetIn(BTC_ASSET);
              setAssetOut(fallbackAsset);
            }

            setIsPreselectedRuneLoading(false);
            setHasLoadedPreselectedRune(true);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('rune');
              window.history.replaceState({}, '', url.toString());
            }
          }
        }
      } else if (!preSelectedRune) {
        setIsPreselectedRuneLoading(false);
        setHasLoadedPreselectedRune(false);
      }
    };

    findAndSelectRune();
  }, [
    preSelectedRune,
    popularRunes,
    hasLoadedPreselectedRune,
    setAssetIn,
    setAssetOut,
    assetOut,
  ]);

  return {
    popularRunes,
    isPopularLoading,
    popularError,
    isPreselectedRuneLoading,
  };
}

export default useSwapRunes;
