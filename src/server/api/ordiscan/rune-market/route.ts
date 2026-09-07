import { getRuneMarketData } from '@/lib/runeMarketData';
import { createRuneRoute } from '@/server/api/ordiscan/helpers';

/**
 * GET handler for fetching market data for a specific Rune.
 * Uses the `createRuneRoute` helper to standardize validation and response handling.
 */
export const GET = createRuneRoute(getRuneMarketData, 'Failed to fetch market info');
