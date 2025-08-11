import { useEffect, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export interface DebouncedSearchState<T> {
  query: string;
  setQuery: (value: string) => void;
  isSearching: boolean;
  results: T[];
  error: string | null;
  onQueryChange: (value: string) => void;
  reset: () => void;
}

/**
 * Generic debounced async search hook.
 * - Provides debounced execution for the supplied fetcher.
 * - Guards state updates when unmounted.
 * - Stringifies non-Error errors safely.
 */
export function useDebouncedSearch<T>(
  fetcher: (query: string) => Promise<T[]>,
  debounceMs = 300,
  initialQuery = '',
): DebouncedSearchState<T> {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Stable fetcher reference
  const stableFetcher = useMemo(() => fetcher, [fetcher]);

  const debounced = useDebouncedCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const data = await stableFetcher(trimmed);
      setResults(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setResults([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSearching(false);
    }
  }, debounceMs);

  useEffect(() => () => debounced.cancel(), [debounced]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    debounced(value);
  };

  const reset = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsSearching(false);
    debounced.cancel();
  };

  return { query, setQuery, isSearching, results, error, onQueryChange, reset };
}

export default useDebouncedSearch;
