import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { fetchRuneBalancesFromApi, QUERY_KEYS } from '@/lib/api';
import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';

/**
 * Fetches Rune balances for the given address using React Query.
 *
 * @param address - The account address to fetch balances for; pass `null` or an empty string to disable the query.
 * @param options - Additional React Query options to merge into the request (`queryKey` and `queryFn` are ignored).
 * @returns The query result containing an array of Rune balances on success or an `Error` on failure.
 */
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