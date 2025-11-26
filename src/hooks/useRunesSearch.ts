import { useMemo, useState } from 'react';

import useSearchWithPopular from '@/hooks/useSearchWithPopular';
import { fetchPopularFromApi, fetchRunesFromApi } from '@/lib/api';
import { useRunesInfoStore } from '@/store/runesInfoStore';
import type { Rune } from '@/types/satsTerminal';
import { mapPopularToRune } from '@/utils/popularRunes';

interface UseRunesSearchOptions {
  cachedPopularRunes?: Record<string, unknown>[];
  isPopularRunesLoading?: boolean;
  popularRunesError?: Error | null;
}

/**
 * Hook for searching Runes with support for popular items and caching.
 * Manages search state, focus, and integration with the global store.
 *
 * @param options - Options for the search (cached items, loading states).
 * @returns Search state, handlers, and results.
 */
export function useRunesSearch({
  cachedPopularRunes = [],
  isPopularRunesLoading = false,
  popularRunesError = null,
}: UseRunesSearchOptions = {}) {
  const { runeSearchQuery: persistedQuery, setRuneSearchQuery } =
    useRunesInfoStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const cachedRunes = useMemo(
    () => mapPopularToRune(cachedPopularRunes),
    [cachedPopularRunes],
  );

  const {
    query: searchQuery,
    onQueryChange,
    results: availableRunes,
    isLoading: isLoadingRunes,
    error: currentRunesError,
  } = useSearchWithPopular<Rune, Rune>({
    searchFn: fetchRunesFromApi,
    popularFn: async () => {
      const data = await fetchPopularFromApi();
      return mapPopularToRune(data);
    },
    mapper: (r) => r,
    initialItems: cachedRunes,
    initialLoading: isPopularRunesLoading,
    initialError: popularRunesError ? popularRunesError.message : null,
    initialQuery: persistedQuery,
  });

  const handleSearchChange = (value: string) => {
    onQueryChange(value);
    setRuneSearchQuery(value);
  };

  const handleSearchFocus = () => setIsSearchFocused(true);

  const handleSearchBlur = () => {
    setTimeout(() => {
      if (!searchQuery.trim()) setIsSearchFocused(false);
    }, 200);
  };

  return {
    searchQuery,
    handleSearchChange,
    handleSearchFocus,
    handleSearchBlur,
    isSearchFocused,
    availableRunes,
    isLoadingRunes,
    currentRunesError,
  };
}

export default useRunesSearch;
