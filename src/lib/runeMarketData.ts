import { logApiError, logDbError } from '@/lib/logger';
import { getOrdiscanClient } from '@/lib/serverUtils';
import {
  fetchRuneMarketDataByName,
  upsertRuneMarketData,
} from '@/lib/supabaseQueries';
import { normalizeRuneName } from '@/utils/runeUtils';

/**
 * Market data for a Rune.
 */
export interface RuneMarketData {
  /** Price in Satoshis. */
  price_in_sats: number;
  /** Price in USD. */
  price_in_usd: number;
  /** Market capitalization in BTC. */
  market_cap_in_btc: number;
  /** Market capitalization in USD. */
  market_cap_in_usd: number;
}

/**
 * Fetches market data for a Rune by name.
 * Tries to fetch from Supabase cache first, then falls back to Ordiscan API.
 * Updates Supabase cache on successful API fetch.
 *
 * @param runeName - The name of the Rune.
 * @returns RuneMarketData object or null if not found/error.
 */
export async function getRuneMarketData(
  runeName: string,
): Promise<RuneMarketData | null> {
  try {
    const normalizedName = normalizeRuneName(runeName);

    // First, try to get from Supabase (10 minutes cache)
    const existingMarketData = await fetchRuneMarketDataByName(
      normalizedName,
      0.17,
    ); // 10 minutes

    if (existingMarketData) {
      return {
        price_in_sats: existingMarketData.price_in_sats || 0,
        price_in_usd: existingMarketData.price_in_usd || 0,
        market_cap_in_btc: existingMarketData.market_cap_in_btc || 0,
        market_cap_in_usd: existingMarketData.market_cap_in_usd || 0,
      };
    }

    // If not in DB or data is stale, fetch from Ordiscan
    const ordiscan = getOrdiscanClient();
    const marketData = await ordiscan.rune.getMarketInfo({
      name: normalizedName,
    });

    if (!marketData) {
      return null;
    }

    // Store in Supabase using centralized utility
    const success = await upsertRuneMarketData(normalizedName, marketData);

    if (!success) {
      logDbError('upsertRuneMarketData', 'Failed to store market data');
    }

    return marketData as RuneMarketData;
  } catch (error: unknown) {
    logApiError('getRuneMarketData', error);
    return null;
  }
}
