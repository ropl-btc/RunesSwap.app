import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseSearchWithPopularOptions<T, R> {
  searchFn: (query: string) => Promise<R[]>;
  mapper: (item: R) => T;
  popularFn?: () => Promise<R[]>;
  initialItems?: T[];
  initialLoading?: boolean;
  initialError?: string | null;
  debounceMs?: number;
  initialQuery?: string;
}

export function useSearchWithPopular<T, R>({
  searchFn,
  mapper,
  popularFn,
  initialItems = [],
  initialLoading = false,
  initialError = null,
  debounceMs = 300,
  initialQuery = '',
}: UseSearchWithPopularOptions<T, R>) {
  // Local input state with debounced value
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, debounceMs);
  const queryClient = useQueryClient();

  // Stable mapper to avoid re-renders inside select
  const mapItem = useMemo(() => mapper, [mapper]);

  const trimmed = debouncedQuery.trim();

  // Search query: runs only when we have a non-empty trimmed query
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    error: searchError,
  } = useQuery<T[], Error>({
    queryKey: ['search', trimmed],
    // Per TanStack docs, queryFn must return a value, not void
    queryFn: async () => {
      const res = await searchFn(trimmed);
      return res.map(mapItem);
    },
    enabled: !!trimmed, // disable until user types something
  });

  // Popular query: used when there is no query; respects provided initialItems
  const {
    data: popularData,
    isLoading: isPopularLoading,
    isFetching: isPopularFetching,
    error: popularError,
  } = useQuery<T[], Error>({
    queryKey: ['popular-items'],
    queryFn: async () => {
      if (!popularFn) return initialItems;
      const res = await popularFn();
      return res.map(mapItem);
    },
    // only relevant when not searching
    enabled: !trimmed,
    // Seed from initialItems if present
    ...(initialItems.length > 0
      ? ({ initialData: initialItems as T[] } as const)
      : {}),
  });

  // Keep popular-items cache in sync with provided initialItems when idle
  useEffect(() => {
    if (!trimmed && initialItems && initialItems.length > 0) {
      queryClient.setQueryData<T[]>(['popular-items'], initialItems);
    }
  }, [initialItems, trimmed, queryClient]);

  const popularSource =
    initialItems.length > 0 ? initialItems : (popularData ?? []);
  const results = trimmed ? (searchData ?? []) : popularSource;
  const isLoading = trimmed
    ? isSearchLoading || isSearchFetching
    : initialItems.length > 0
      ? !!initialLoading
      : isPopularLoading || isPopularFetching || initialLoading;
  const error = trimmed
    ? searchError
      ? searchError.message
      : null
    : initialItems.length > 0
      ? initialError
      : popularError
        ? popularError.message
        : null;

  const onQueryChange = (value: string) => setQuery(value);
  const reset = () => setQuery('');

  return { query, onQueryChange, results, isLoading, error, reset } as {
    query: string;
    onQueryChange: (value: string) => void;
    results: T[];
    isLoading: boolean;
    error: string | null;
    reset: () => void;
  };
}

export default useSearchWithPopular;
