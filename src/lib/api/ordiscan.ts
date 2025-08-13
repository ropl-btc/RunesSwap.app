import {
  type RuneBalance as OrdiscanRuneBalance,
  type RuneInfo as OrdiscanRuneInfo,
  type RuneMarketInfo as OrdiscanRuneMarketInfo,
  type RuneActivityEvent,
} from '@/types/ordiscan';
import { normalizeRuneName } from '@/utils/runeUtils';
import { get, post } from '../fetchWrapper';
import { logFetchError } from '../logger';
import { type RuneData } from '../runesData';
import { getErrorMessageFromData, handleApiResponse } from './utils';

export const fetchBtcBalanceFromApi = async (
  address: string,
): Promise<number> => {
  try {
    const { data } = await get<{ success: boolean; data: { balance: number } }>(
      `/api/ordiscan/btc-balance?address=${encodeURIComponent(address)}`,
    );

    if (!data.success) {
      throw new Error('Failed to fetch BTC balance');
    }

    const parsedData = handleApiResponse<{ balance: number }>(data, false);
    return parsedData?.balance || 0;
  } catch (error) {
    logFetchError(`/api/ordiscan/btc-balance?address=${address}`, error);
    throw new Error(`Failed to fetch BTC balance for ${address}`);
  }
};

export const fetchRuneBalancesFromApi = async (
  address: string,
): Promise<OrdiscanRuneBalance[]> => {
  try {
    const { data } = await get<{
      success: boolean;
      data: OrdiscanRuneBalance[];
    }>(`/api/ordiscan/rune-balances?address=${encodeURIComponent(address)}`);

    if (!data.success) {
      throw new Error('Failed to fetch rune balances');
    }

    return handleApiResponse<OrdiscanRuneBalance[]>(data, true);
  } catch (error) {
    logFetchError(`/api/ordiscan/rune-balances?address=${address}`, error);
    throw new Error(`Failed to fetch rune balances for ${address}`);
  }
};

export const fetchRuneInfoFromApi = async (
  name: string,
): Promise<RuneData | null> => {
  const normalizedName = normalizeRuneName(name);
  try {
    const { data } = await get<{ success: boolean; data: RuneData }>(
      `/api/ordiscan/rune-info?name=${encodeURIComponent(normalizedName)}`,
    );

    if (!data.success) {
      throw new Error('Failed to fetch rune info');
    }

    return handleApiResponse<RuneData | null>(data, false);
  } catch (error: unknown) {
    // Handle 404 responses (rune not found)
    if (
      error instanceof Error &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }

    logFetchError(`/api/ordiscan/rune-info?name=${normalizedName}`, error);
    throw new Error(
      getErrorMessageFromData(error, `Failed to fetch rune info for ${name}`),
    );
  }
};

export const updateRuneDataViaApi = async (
  name: string,
): Promise<RuneData | null> => {
  const normalizedName = normalizeRuneName(name);
  try {
    const { data } = await post<{ success: boolean; data: RuneData }>(
      '/api/ordiscan/rune-update',
      { name: normalizedName },
    );

    if (!data.success) {
      throw new Error('Failed to update rune data');
    }

    return handleApiResponse<RuneData | null>(data, false);
  } catch (error: unknown) {
    // Handle 404 responses (rune not found)
    if (
      error instanceof Error &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }

    logFetchError('/api/ordiscan/rune-update', error);
    throw new Error(
      getErrorMessageFromData(error, `Failed to update rune data for ${name}`),
    );
  }
};

export const fetchRuneMarketFromApi = async (
  name: string,
): Promise<OrdiscanRuneMarketInfo | null> => {
  const normalizedName = normalizeRuneName(name);
  try {
    const { data } = await get<{
      success: boolean;
      data: OrdiscanRuneMarketInfo;
    }>(`/api/ordiscan/rune-market?name=${encodeURIComponent(normalizedName)}`);

    if (!data.success) {
      throw new Error('Failed to fetch market info');
    }

    return handleApiResponse<OrdiscanRuneMarketInfo | null>(data, false);
  } catch (error: unknown) {
    // Handle 404 responses (market info not found)
    if (
      error instanceof Error &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }

    logFetchError(`/api/ordiscan/rune-market?name=${normalizedName}`, error);
    throw new Error(
      getErrorMessageFromData(error, `Failed to fetch market info for ${name}`),
    );
  }
};

export const fetchListRunesFromApi = async (): Promise<OrdiscanRuneInfo[]> => {
  try {
    const { data } = await get<{ success: boolean; data: OrdiscanRuneInfo[] }>(
      '/api/ordiscan/list-runes',
    );

    if (!data.success) {
      throw new Error('Failed to fetch runes list');
    }

    return handleApiResponse<OrdiscanRuneInfo[]>(data, true);
  } catch (error) {
    logFetchError('/api/ordiscan/list-runes', error);
    throw new Error('Failed to fetch runes list');
  }
};

export const fetchRuneActivityFromApi = async (
  address: string,
): Promise<RuneActivityEvent[]> => {
  try {
    const { data } = await get<{ success: boolean; data: RuneActivityEvent[] }>(
      `/api/ordiscan/rune-activity?address=${encodeURIComponent(address)}`,
    );

    if (!data.success) {
      throw new Error('Failed to fetch rune activity');
    }

    return handleApiResponse<RuneActivityEvent[]>(data, true);
  } catch (error) {
    logFetchError(`/api/ordiscan/rune-activity?address=${address}`, error);
    throw new Error(`Failed to fetch rune activity for ${address}`);
  }
};

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

  let querySlug = runeName;
  if (runeName.includes('LIQUIDIUM')) {
    querySlug = 'LIQUIDIUMTOKEN';
  }

  try {
    const { data } = await get<{
      success: boolean;
      data: PriceHistoryResponse;
    }>(`/api/rune-price-history?slug=${encodeURIComponent(querySlug)}`);

    if (!data.success) {
      throw new Error('Failed to fetch price history');
    }

    return handleApiResponse<PriceHistoryResponse>(data, false);
  } catch (error) {
    logFetchError(`/api/rune-price-history?slug=${querySlug}`, error);
    throw new Error(`Failed to fetch price history for ${runeName}`);
  }
};

export const fetchPortfolioDataFromApi = async (
  address: string,
): Promise<{
  balances: OrdiscanRuneBalance[];
  runeInfos: Record<string, RuneData>;
  marketData: Record<string, OrdiscanRuneMarketInfo>;
}> => {
  if (!address) {
    return { balances: [], runeInfos: {}, marketData: {} };
  }

  try {
    const { data } = await get<{
      success: boolean;
      data: {
        balances: OrdiscanRuneBalance[];
        runeInfos: Record<string, RuneData>;
        marketData: Record<string, OrdiscanRuneMarketInfo>;
      };
    }>(`/api/portfolio-data?address=${encodeURIComponent(address)}`);

    if (!data.success) {
      throw new Error('Failed to fetch portfolio data');
    }

    return handleApiResponse<{
      balances: OrdiscanRuneBalance[];
      runeInfos: Record<string, RuneData>;
      marketData: Record<string, OrdiscanRuneMarketInfo>;
    }>(data, false);
  } catch (error) {
    logFetchError(`/api/portfolio-data?address=${address}`, error);
    throw new Error(`Failed to fetch portfolio data for ${address}`);
  }
};
