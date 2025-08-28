import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, fetchPopularFromApi } from '@/lib/api';

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

  const mapped =
    mapper && data ? mapper(data) : ((data ?? []) as unknown as T[]);

  return {
    popularRunes: mapped,
    isLoading,
    error: error ?? null,
  };
}

export default usePopularRunes;
