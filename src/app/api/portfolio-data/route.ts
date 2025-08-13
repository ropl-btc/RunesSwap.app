import { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  validateRequest,
} from '@/lib/apiUtils';
import { RuneData } from '@/lib/runesData';
import { getOrdiscanClient } from '@/lib/serverUtils';
import {
  batchFetchRuneMarketData,
  batchFetchRunes,
} from '@/lib/supabaseQueries';
import { requestSchemas } from '@/lib/validationSchemas';
import { RuneBalance, RuneMarketInfo } from '@/types/ordiscan';

export async function GET(request: NextRequest) {
  // const { searchParams } = new URL(request.url);
  // const address = searchParams.get('address');

  // Use centralized validation schema
  const validation = await validateRequest(
    request,
    requestSchemas.addressRequest,
    'query',
  );
  if (!validation.success) {
    return validation.errorResponse;
  }
  const { address: validAddress } = validation.data;

  try {
    // Fetch balances from Ordiscan (always fresh)
    const ordiscan = getOrdiscanClient();
    const balancesPromise = ordiscan.address.getRunes({
      address: validAddress,
    });

    // Wait for balances first since we need the rune names for subsequent queries
    const balances: RuneBalance[] = await balancesPromise;
    const validBalances: RuneBalance[] = Array.isArray(balances)
      ? balances
      : [];

    if (validBalances.length === 0) {
      return createSuccessResponse({
        balances: [],
        runeInfos: {},
        marketData: {},
      });
    }

    // Extract all rune names
    const runeNames = validBalances.map((balance) => balance.name);

    // Fetch rune info and market data in parallel using centralized utilities
    const [runeInfos, marketData] = await Promise.all([
      batchFetchRunes(runeNames),
      batchFetchRuneMarketData(runeNames),
    ]);

    // Convert array data to maps for easy client-side lookup
    const runeInfoMap: Record<string, RuneData> = {};
    const marketDataMap: Record<string, RuneMarketInfo> = {};

    (runeInfos || []).forEach((info) => {
      runeInfoMap[info.name] = info as RuneData;
    });

    (marketData || []).forEach((market) => {
      marketDataMap[market.rune_name] = {
        price_in_sats: market.price_in_sats || 0,
        price_in_usd: market.price_in_usd || 0,
        market_cap_in_btc: market.market_cap_in_btc || 0,
        market_cap_in_usd: market.market_cap_in_usd || 0,
      };
    });

    // Prepare arrays for missing data
    const missingRuneNames = runeNames.filter((name) => !runeInfoMap[name]);
    const missingMarketDataNames = runeNames.filter(
      (name) => !marketDataMap[name],
    );

    // Use lib functions for missing data
    const { getRuneData } = await import('@/lib/runesData');
    const { getRuneMarketData } = await import('@/lib/runeMarketData');

    // Fetch missing rune info
    const missingRuneInfoResults = await Promise.all(
      missingRuneNames.map((runeName) => getRuneData(runeName)),
    );
    missingRuneNames.forEach((runeName, idx) => {
      const data = missingRuneInfoResults[idx];
      if (data) {
        runeInfoMap[runeName] = data;
      }
    });

    // Fetch missing market data
    const missingMarketDataResults = await Promise.all(
      missingMarketDataNames.map((runeName) => getRuneMarketData(runeName)),
    );
    missingMarketDataNames.forEach((runeName, idx) => {
      const data = missingMarketDataResults[idx];
      if (data) {
        marketDataMap[runeName] = data;
      }
    });

    // Transform balances to match documented API format (amount -> balance)
    const formattedBalances = validBalances.map((balance) => ({
      name: balance.name,
      balance:
        (balance as { amount?: string; balance?: string }).amount ||
        (balance as { amount?: string; balance?: string }).balance, // Support both formats for backward compatibility
    }));

    // Return the combined data
    return createSuccessResponse({
      balances: formattedBalances,
      runeInfos: runeInfoMap,
      marketData: marketDataMap,
    });
  } catch (error) {
    const errorInfo = handleApiError(
      error,
      `Failed to fetch portfolio data for ${validAddress}`,
    );
    return createErrorResponse(
      errorInfo.message,
      errorInfo.details,
      errorInfo.status,
    );
  }
}
