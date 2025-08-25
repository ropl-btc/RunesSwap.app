import { fetchRuneMarketFromApi } from '@/lib/api';
import { useRuneDataQuery } from '@/hooks/useRuneDataQuery';

interface UseRuneMarketDataOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

/**
 * Hook for fetching rune market data
 */
export function useRuneMarketData(
  runeName: string | null | undefined,
  options: UseRuneMarketDataOptions = {},
) {
  return useRuneDataQuery('runeMarket', runeName, fetchRuneMarketFromApi, {
    staleTime: 60000,
    retry: 2,
    ...options,
  });
}
