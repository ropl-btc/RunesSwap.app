import { useQuery } from '@tanstack/react-query';
import { fetchRuneMarketFromApi } from '@/lib/api';
import type { RuneMarketData } from '@/types/common';

interface UseRuneMarketDataOptions {
  /**
   * Whether to enable the query
   * @default true when runeName is provided
   */
  enabled?: boolean;
  /**
   * Query stale time
   * @default 60000 (1 minute - market data changes more frequently)
   */
  staleTime?: number;
  /**
   * Number of retries on error
   * @default 3
   */
  retry?: number;
}

/**
 * Shared hook for fetching rune market data
 * @param runeName - The name of the rune to fetch market data for
 * @param options - Additional query options
 * @returns React Query result with market data
 */
export function useRuneMarketData(
  runeName: string | null | undefined,
  options: UseRuneMarketDataOptions = {},
) {
  const {
    enabled,
    staleTime = 60000, // 1 minute
    retry = 3,
  } = options;

  return useQuery<RuneMarketData | null, Error>({
    queryKey: ['runeMarketApi', (runeName || '').toUpperCase()],
    queryFn: () =>
      runeName ? fetchRuneMarketFromApi(runeName) : Promise.resolve(null),
    enabled: enabled !== undefined ? enabled : !!runeName,
    staleTime,
    retry,
  });
}
