import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchPopularFromApi, QUERY_KEYS } from '@/lib/api';

/**
 * Fetches the popular runes list from the API and exposes mapped data along with loading and error state.
 *
 * @param mapper - Optional transformer to convert the raw API records (`Record<string, unknown>[]`) into `T[]`.
 * @returns An object with:
 *  - `popularRunes` — the mapped runes array (`T[]`), or an empty array if no data is available.
 *  - `isLoading` — `true` while the query is in flight, `false` otherwise.
 *  - `error` — an `Error` when the query failed, or `null` when there is no error.
 */
export function usePopularRunes(
  mapper?: (data: Record<string, unknown>[]) => Record<string, unknown>[],
): {
  popularRunes: Record<string, unknown>[];
  isLoading: boolean;
  error: Error | null;
};
export function usePopularRunes<T>(
  mapper: (data: Record<string, unknown>[]) => T[],
): {
  popularRunes: T[];
  isLoading: boolean;
  error: Error | null;
};
export function usePopularRunes<T = Record<string, unknown>>(
  mapper?: (data: Record<string, unknown>[]) => T[],
) {
  const { data, isLoading, error } = useQuery<Record<string, unknown>[], Error>(
    {
      queryKey: [QUERY_KEYS.POPULAR_RUNES],
      queryFn: fetchPopularFromApi,
      // Popular list changes infrequently; cache for 24h and GC after 25h
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 25 * 60 * 60 * 1000,
    },
  );

  const mapped = useMemo(
    () => (mapper && data ? mapper(data) : ((data ?? []) as unknown as T[])),
    [data, mapper],
  );

  return {
    popularRunes: mapped,
    isLoading,
    error: error ?? null,
  };
}

export default usePopularRunes;
