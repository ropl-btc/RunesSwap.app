import { useState } from 'react';
import { fetchRunesFromApi } from '@/lib/api';
import { useRunesInfoStore } from '@/store/runesInfoStore';
import type { Rune } from '@/types/satsTerminal';
import { mapPopularToRune } from '@/utils/popularRunes';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import usePopularRunes from '@/hooks/usePopularRunes';
export function useRunesSearch() {
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

  const {
    popularRunes,
    isLoading: isPopularLoading,
    error: popularError,
  } = usePopularRunes<Rune>(mapPopularToRune);

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
  const currentRunesError = searchQuery.trim()
    ? search.error
    : popularError?.message || null;

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
