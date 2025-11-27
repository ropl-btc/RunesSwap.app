import { useQuery } from '@tanstack/react-query';

import { getBtcPrice } from '@/lib/api/coingecko';

/**
 * Subscribes to the current Bitcoin price in USD and exposes the value along with loading and error state.
 *
 * @returns An object containing:
 * - `btcPriceUsd` — the latest Bitcoin price in USD, or `undefined` if not yet available.
 * - `isBtcPriceLoading` — `true` while the price is being fetched, `false` otherwise.
 * - `btcPriceError` — an error object if the query failed, or `undefined` if there is no error.
 */
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
