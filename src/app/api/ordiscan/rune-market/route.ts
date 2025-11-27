import { createRuneRoute } from '@/app/api/ordiscan/helpers';
import { getRuneMarketData } from '@/lib/runeMarketData';

/**
 * GET handler for fetching market data for a specific Rune.
 * Uses the `createRuneRoute` helper to standardize validation and response handling.
 */
export const GET = createRuneRoute(
  getRuneMarketData,
  'Failed to fetch market info',
);
