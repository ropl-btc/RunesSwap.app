import {
  type RuneBalance as OrdiscanRuneBalance,
  type RuneInfo as OrdiscanRuneInfo,
  type RuneMarketInfo as OrdiscanRuneMarketInfo,
  type RuneActivityEvent,
} from '@/types/ordiscan';
import { normalizeRuneName } from '@/utils/runeUtils';
import { type RuneData } from '@/lib/runesData';
import { apiGet, apiPost } from '@/lib/api/createApiClient';

export const fetchRuneEndpoint = async <T>(
  endpoint: string,
  method: 'GET' | 'POST',
  name: string,
): Promise<T | null> => {
  try {
    const normalizedName = normalizeRuneName(name);
    const requester = method === 'POST' ? apiPost : apiGet;
    return await requester<T>(endpoint, { name: normalizedName });
  } catch {
    return null;
  }
};

export const fetchBtcBalanceFromApi = async (
  address: string,
): Promise<number> => {
  const data = await apiGet<{ balance: number }>('/api/ordiscan/btc-balance', {
    address,
  });
  return data?.balance || 0;
};

export const fetchRuneBalancesFromApi = async (
  address: string,
): Promise<OrdiscanRuneBalance[]> =>
  apiGet<OrdiscanRuneBalance[]>('/api/ordiscan/rune-balances', {
    address,
  });

export const fetchRuneInfoFromApi = async (
  name: string,
): Promise<RuneData | null> =>
  fetchRuneEndpoint<RuneData>('/api/ordiscan/rune-info', 'GET', name);

export const updateRuneDataViaApi = async (
  name: string,
): Promise<RuneData | null> =>
  fetchRuneEndpoint<RuneData>('/api/ordiscan/rune-update', 'POST', name);

export const fetchRuneMarketFromApi = async (
  name: string,
): Promise<OrdiscanRuneMarketInfo | null> =>
  fetchRuneEndpoint<OrdiscanRuneMarketInfo>(
    '/api/ordiscan/rune-market',
    'GET',
    name,
  );

export const fetchListRunesFromApi = async (): Promise<OrdiscanRuneInfo[]> =>
  apiGet<OrdiscanRuneInfo[]>('/api/ordiscan/list-runes');

export const fetchRuneActivityFromApi = async (
  address: string,
): Promise<RuneActivityEvent[]> =>
  apiGet<RuneActivityEvent[]>('/api/ordiscan/rune-activity', {
    address,
  });

export interface PriceHistoryDataPoint {
  timestamp: number;
  price: number;
}

export interface PriceHistoryResponse {
  slug: string;
  prices: PriceHistoryDataPoint[];
  available: boolean;
}

export const fetchRunePriceHistoryFromApi = async (
  runeName: string,
): Promise<PriceHistoryResponse> => {
  if (!runeName || runeName.trim() === '') {
    return {
      slug: '',
      prices: [],
      available: false,
    };
  }

  let slug = runeName;
  if (runeName.includes('LIQUIDIUM')) {
    slug = 'LIQUIDIUMTOKEN';
  }

  return apiGet<PriceHistoryResponse>('/api/rune-price-history', { slug });
};

// Type alias for complex portfolio response
type PortfolioDataResponse = {
  balances: OrdiscanRuneBalance[];
  runeInfos: Record<string, RuneData>;
  marketData: Record<string, OrdiscanRuneMarketInfo>;
};

export const fetchPortfolioDataFromApi = async (
  address: string,
): Promise<PortfolioDataResponse> => {
  if (!address) {
    return { balances: [], runeInfos: {}, marketData: {} };
  }

  return apiGet<PortfolioDataResponse>('/api/portfolio-data', { address });
};
