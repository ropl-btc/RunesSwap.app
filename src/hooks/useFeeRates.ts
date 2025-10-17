import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type { BitcoinFeeRates } from '@/lib/api';
import { fetchRecommendedFeeRates, QUERY_KEYS } from '@/lib/api';

export const useFeeRates = (
  options?: Omit<UseQueryOptions<BitcoinFeeRates>, 'queryKey' | 'queryFn'>,
) =>
  useQuery<BitcoinFeeRates>({
    queryKey: [QUERY_KEYS.BTC_FEE_RATES],
    queryFn: fetchRecommendedFeeRates,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    ...(options as Omit<
      UseQueryOptions<BitcoinFeeRates>,
      'queryKey' | 'queryFn'
    >),
  });

export default useFeeRates;
