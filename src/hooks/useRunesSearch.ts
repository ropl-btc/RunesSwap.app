import { useEffect, useState } from 'react';
import { fetchPopularFromApi, fetchRunesFromApi } from '@/lib/api';
import { useRunesInfoStore } from '@/store/runesInfoStore';
import type { Rune } from '@/types/satsTerminal';
import { useDebouncedSearch } from './useDebouncedSearch';

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

      if (cachedPopularRunes && cachedPopularRunes.length > 0) {
        const liquidiumToken: Rune = {
          id: 'liquidiumtoken',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
        };
        const fetchedRunes: Rune[] = cachedPopularRunes
          .map((collection: Record<string, unknown>) => ({
            id: (collection?.rune as string) || `unknown_${Math.random()}`,
            name:
              ((collection?.etching as Record<string, unknown>)
                ?.runeName as string) ||
              (collection?.rune as string) ||
              'Unknown',
            imageURI:
              (collection?.icon_content_url_data as string) ||
              (collection?.imageURI as string),
          }))
          .filter(
            (rune) =>
              rune.id !== liquidiumToken.id &&
              rune.name !== liquidiumToken.name,
          );
        setPopularRunes([liquidiumToken, ...fetchedRunes]);
        setPopularError(null);
        setIsPopularLoading(false);
        return;
      }

      setIsPopularLoading(true);
      setPopularError(null);
      setPopularRunes([]);
      try {
        const liquidiumToken: Rune = {
          id: 'liquidiumtoken',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
        };
        const response = await fetchPopularFromApi();
        let mappedRunes: Rune[] = [];
        if (!Array.isArray(response)) {
          mappedRunes = [liquidiumToken];
        } else {
          const fetchedRunes: Rune[] = response
            .map((collection: Record<string, unknown>) => ({
              id: (collection?.rune as string) || `unknown_${Math.random()}`,
              name:
                ((collection?.etching as Record<string, unknown>)
                  ?.runeName as string) ||
                (collection?.rune as string) ||
                'Unknown',
              imageURI:
                (collection?.icon_content_url_data as string) ||
                (collection?.imageURI as string),
            }))
            .filter(
              (rune) =>
                rune.id !== liquidiumToken.id &&
                rune.name !== liquidiumToken.name,
            );
          mappedRunes = [liquidiumToken, ...fetchedRunes];
        }
        setPopularRunes(mappedRunes);
      } catch (error) {
        setPopularError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch popular runes',
        );
        const liquidiumTokenOnError: Rune = {
          id: 'liquidiumtoken',
          name: 'LIQUIDIUM•TOKEN',
          imageURI: 'https://icon.unisat.io/icon/runes/LIQUIDIUM%E2%80%A2TOKEN',
        };
        setPopularRunes([liquidiumTokenOnError]);
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
