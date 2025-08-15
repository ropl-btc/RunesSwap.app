import { fetchExternal } from '@/lib/fetchWrapper';
import { logFetchError } from '@/lib/logger';

export const COINGECKO_BTC_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

export const getBtcPrice = async (): Promise<number> => {
  try {
    const { data } = await fetchExternal<CoinGeckoResponse>(
      COINGECKO_BTC_PRICE_URL,
      {
        timeout: 10000,
        retries: 3,
      },
    );

    if (!data.bitcoin || !data.bitcoin.usd) {
      throw new Error('Invalid response format from CoinGecko');
    }

    return data.bitcoin.usd;
  } catch (error) {
    logFetchError(COINGECKO_BTC_PRICE_URL, error);
    throw new Error('Failed to fetch BTC price from CoinGecko');
  }
};
