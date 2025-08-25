import { fetchRunesFromApi } from '@/lib/api';
import useSearchWithPopular from '@/hooks/useSearchWithPopular';
import { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';

interface UseAssetSearchArgs {
  availableAssets: Asset[];
  isAssetsLoading?: boolean;
  assetsError?: string | null;
}

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
