import { fetchRunesFromApi } from '@/lib/api';
import { Asset } from '@/types/common';
import type { Rune } from '@/types/satsTerminal';
import { useDebouncedSearch } from './useDebouncedSearch';

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
  const search = useDebouncedSearch<Asset>(async (q) => {
    const results: Rune[] = await fetchRunesFromApi(q);
    return results.map((r) => ({
      id: r.id,
      name: r.name,
      imageURI: r.imageURI,
      isBTC: false,
    }));
  });

  const displayedAssets = search.query.trim()
    ? search.results
    : availableAssets;
  const isLoadingAssets = search.query.trim()
    ? search.isSearching
    : isAssetsLoading;
  const currentError = search.query.trim() ? search.error : assetsError;

  return {
    searchQuery: search.query,
    handleSearchChange: (value: string) => search.onQueryChange(value),
    displayedAssets,
    isLoadingAssets,
    currentError,
  };
}

export default useAssetSearch;
