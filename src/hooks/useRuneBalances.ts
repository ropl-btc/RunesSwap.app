import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { QUERY_KEYS, fetchRuneBalancesFromApi } from '@/lib/api';
import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';

export function useRuneBalances(
  address: string | null,
  options?: Omit<
    UseQueryOptions<OrdiscanRuneBalance[], Error>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<OrdiscanRuneBalance[], Error> {
  return useQuery<OrdiscanRuneBalance[], Error>({
    queryKey: [QUERY_KEYS.RUNE_BALANCES, address],
    queryFn: () => fetchRuneBalancesFromApi(address || ''),
    enabled: !!address,
    ...options,
  });
}

export default useRuneBalances;
