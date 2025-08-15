import { useEffect, useState } from 'react';
import { fetchPopularFromApi, fetchRunesFromApi } from '@/lib/api';
import { useRunesInfoStore } from '@/store/runesInfoStore';
import type { Rune } from '@/types/satsTerminal';
import { mapPopularToRune } from '@/utils/popularRunes';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';

interface UseRunesSearchOptions {
  cachedPopularRunes?: Record<string, unknown>[];
  isPopularRunesLoading?: boolean;
  popularRunesError?: Error | null;
}

export function useRunesSearch({
  cachedPopularRunes = [],
  isPopularRunesLoading = false,
  popularRunesError = null,
}: UseRunesSearchOptions = {}) {
  const { runeSearchQuery: persistedQuery, setRuneSearchQuery } =
    useRunesInfoStore();

  const [searchQuery, setSearchQuery] = useState(persistedQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const search = useDebouncedSearch<Rune>(
    async (q) => {
      const results: Rune[] = await fetchRunesFromApi(q);
      return results;
    },
    300,
    persistedQuery,
  );

  const [isPopularLoading, setIsPopularLoading] = useState(
    isPopularRunesLoading,
  );
  const [popularRunes, setPopularRunes] = useState<Rune[]>([]);
  const [popularError, setPopularError] = useState<string | null>(
    popularRunesError ? popularRunesError.message : null,
  );

  useEffect(() => {
    const fetchPopular = async () => {
      if (isPopularRunesLoading) {
        setIsPopularLoading(true);
        return;
      }

      if (popularRunesError) {
        setPopularError(popularRunesError.message);
        setIsPopularLoading(false);
        return;
      }

      setIsPopularLoading(true);
      try {
        // Try cached data first, then fetch if needed
        const runesData =
          cachedPopularRunes && cachedPopularRunes.length > 0
            ? cachedPopularRunes
            : await fetchPopularFromApi();

        // Convert to Rune format - LIQUIDIUM•TOKEN is already first in our list
        const mappedRunes: Rune[] = mapPopularToRune(runesData);
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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setRuneSearchQuery(query);
    search.onQueryChange(query);
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      if (!searchQuery.trim()) {
        setIsSearchFocused(false);
      }
    }, 200);
  };

  const availableRunes = searchQuery.trim() ? search.results : popularRunes;
  const isLoadingRunes = searchQuery.trim()
    ? search.isSearching
    : isPopularLoading;
  const currentRunesError = searchQuery.trim() ? search.error : popularError;

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
