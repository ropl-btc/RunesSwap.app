import { useEffect, useState } from 'react';

import usePopularRunes from '@/hooks/usePopularRunes';
import { fetchRunesFromApi } from '@/lib/api';
import type { Asset } from '@/types/common';
import { BTC_ASSET } from '@/types/common';
import { mapPopularToAsset } from '@/utils/popularRunes';
import { getRuneIconUrl, normalizeRuneName } from '@/utils/runeUtils';
import { safeArrayFirst } from '@/utils/typeGuards';

interface UseSwapRunesArgs {
  preSelectedRune?: string | null;
  preSelectedAsset?: Asset | null;
  assetOut: Asset | null;
  setAssetIn: React.Dispatch<React.SetStateAction<Asset>>;
  setAssetOut: React.Dispatch<React.SetStateAction<Asset | null>>;
}

/**
 * Hook to manage available Runes for swapping.
 * Handles fetching popular Runes and pre-selecting Runes from URL parameters.
 *
 * @param args - Arguments including pre-selected rune/asset and state setters.
 * @returns Popular runes list and loading states.
 */
export function useSwapRunes({
  preSelectedRune = null,
  preSelectedAsset = null,
  assetOut,
  setAssetIn,
  setAssetOut,
}: UseSwapRunesArgs) {
  const {
    popularRunes: basePopularRunes,
    isLoading: isPopularLoading,
    error: popularError,
  } = usePopularRunes<Asset>(mapPopularToAsset);
  const [popularRunes, setPopularRunes] = useState<Asset[]>([]);
  const [isPreselectedRuneLoading, setIsPreselectedRuneLoading] =
    useState(!!preSelectedRune);
  const [hasLoadedPreselectedRune, setHasLoadedPreselectedRune] =
    useState(false);

  useEffect(() => {
    if (preSelectedAsset && !hasLoadedPreselectedRune) {
      setAssetIn(BTC_ASSET);
      setAssetOut(preSelectedAsset);
      setIsPreselectedRuneLoading(false);
      setHasLoadedPreselectedRune(true);
    }
  }, [preSelectedAsset, setAssetIn, setAssetOut, hasLoadedPreselectedRune]);

  useEffect(() => {
    if (isPopularLoading) return;
    let runes = basePopularRunes;
    if (preSelectedAsset) {
      const exists = runes.some((r) => r.id === preSelectedAsset.id);
      if (!exists) runes = [preSelectedAsset, ...runes];
    }
    setPopularRunes(runes);
    if (!preSelectedRune && !assetOut && runes.length > 0) {
      const firstRune = safeArrayFirst(runes);
      if (firstRune) setAssetOut(firstRune);
    }
  }, [
    basePopularRunes,
    isPopularLoading,
    preSelectedAsset,
    preSelectedRune,
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
