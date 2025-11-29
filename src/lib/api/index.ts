export * from '@/lib/api/coingecko';
export * from '@/lib/api/liquidium';
export * from '@/lib/api/ordiscan';
export * from '@/lib/api/satsTerminal';

import { apiGet } from '@/lib/api/createApiClient';
import { fetchExternal } from '@/lib/fetchWrapper';
import { logFetchError } from '@/lib/logger';

export const QUERY_KEYS = {
  POPULAR_RUNES: 'popularRunes',
  RUNE_INFO: 'runeInfo',
  RUNE_MARKET: 'runeMarket',
  RUNE_PRICE_HISTORY: 'runePriceHistory',
  BTC_BALANCE: 'btcBalance',
  RUNE_BALANCES: 'runeBalances',
  RUNE_LIST: 'runesList',
  RUNE_ACTIVITY: 'runeActivity',
  PORTFOLIO_DATA: 'portfolioData',
  LIQUIDIUM_PORTFOLIO: 'liquidiumPortfolio',
  BTC_FEE_RATES: 'btcFeeRates',
} as const;

export type QueryKey = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];

export const fetchPopularFromApi = async (): Promise<
  Record<string, unknown>[]
> => apiGet<Record<string, unknown>[]>('/api/popular-runes');

export interface BitcoinFeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export const fetchRecommendedFeeRates = async (): Promise<BitcoinFeeRates> => {
  const defaultRates: BitcoinFeeRates = {
    fastestFee: 25,
    halfHourFee: 20,
    hourFee: 15,
    economyFee: 10,
    minimumFee: 5,
  };

  try {
    const { data } = await fetchExternal<BitcoinFeeRates>(
      'https://mempool.space/api/v1/fees/recommended',
      { timeout: 10000, retries: 2 },
    );
    return data;
  } catch (error) {
    logFetchError('https://mempool.space/api/v1/fees/recommended', error);
    return defaultRates;
  }
};
