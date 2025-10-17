import { useQuery } from '@tanstack/react-query';

import { getBtcPrice } from '@/lib/api/coingecko';

export function useBtcPrice() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['btcPriceUsd'],
    queryFn: getBtcPrice,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return {
    btcPriceUsd: data,
    isBtcPriceLoading: isLoading,
    btcPriceError: error,
  };
}

export default useBtcPrice;
