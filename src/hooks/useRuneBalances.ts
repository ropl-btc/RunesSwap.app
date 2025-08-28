import { useApiQuery } from '@/hooks/useApiQuery';
import { QUERY_KEYS, fetchRuneBalancesFromApi } from '@/lib/api';
import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';

interface UseRuneBalancesOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

export function useRuneBalances(
  address: string | null | undefined,
  options: UseRuneBalancesOptions = {},
) {
  const { enabled, staleTime, retry } = options;
  const config: { enabled?: boolean; retry?: number } = {};
  if (enabled !== undefined) {
    config.enabled = enabled;
  }
  if (retry !== undefined) {
    config.retry = retry;
  }

  return useApiQuery<OrdiscanRuneBalance[]>(
    QUERY_KEYS.RUNE_BALANCES,
    address,
    fetchRuneBalancesFromApi,
    staleTime,
    config,
  );
}

export default useRuneBalances;
