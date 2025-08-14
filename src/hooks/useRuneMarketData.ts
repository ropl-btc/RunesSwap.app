import { useQuery } from '@tanstack/react-query';
import { fetchRuneMarketFromApi } from '@/lib/api';

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
  const { enabled = !!runeName, staleTime = 60000, retry = 2 } = options;

  return useQuery({
    queryKey: ['runeMarket', runeName?.toUpperCase() || ''],
    queryFn: () =>
      runeName ? fetchRuneMarketFromApi(runeName) : Promise.resolve(null),
    enabled: enabled && !!runeName,
    staleTime,
    retry,
  });
}
