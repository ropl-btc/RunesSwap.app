import useSearchWithPopular from '@/hooks/useSearchWithPopular';
import { fetchRunesFromApi } from '@/lib/api';
import type { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';

interface UseAssetSearchArgs {
  availableAssets: Asset[];
  isAssetsLoading?: boolean;
  assetsError?: string | null;
}

/**
 * Hook for searching assets (Runes) with support for popular items.
 * Wraps useSearchWithPopular with specific logic for Asset type.
 *
 * @param args - Arguments for the hook.
 * @param args.availableAssets - List of initially available assets (e.g. popular ones).
 * @param args.isAssetsLoading - Loading state for initial assets.
 * @param args.assetsError - Error state for initial assets.
 * @returns Search state and results.
 */
export function useAssetSearch({
  availableAssets,
  isAssetsLoading = false,
  assetsError = null,
}: UseAssetSearchArgs) {
  const {
    query: searchQuery,
    onQueryChange: handleSearchChange,
    results: displayedAssets,
    isLoading: isLoadingAssets,
    error: currentError,
  } = useSearchWithPopular<Asset, Rune>({
    searchFn: fetchRunesFromApi,
    mapper: (r) => ({
      id: r.id,
      name: r.name,
      imageURI: r.imageURI,
      isBTC: false,
    }),
    initialItems: availableAssets,
    initialLoading: isAssetsLoading,
    initialError: assetsError,
  });

  return {
    searchQuery,
    handleSearchChange,
    displayedAssets,
    isLoadingAssets,
    currentError,
  };
}

export default useAssetSearch;
