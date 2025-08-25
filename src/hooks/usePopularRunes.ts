import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, fetchPopularFromApi } from '@/lib/api';

export function usePopularRunes<T = Record<string, unknown>>(
  mapper?: (data: Record<string, unknown>[]) => T[],
) {
  const { data, isLoading, error } = useQuery<Record<string, unknown>[], Error>(
    {
      queryKey: [QUERY_KEYS.POPULAR_RUNES],
      queryFn: fetchPopularFromApi,
      staleTime: Infinity,
      gcTime: Infinity,
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
