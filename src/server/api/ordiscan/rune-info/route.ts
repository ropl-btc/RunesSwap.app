import { getRuneData } from '@/lib/runesData';
import { createRuneRoute } from '@/server/api/ordiscan/helpers';

/**
 * GET handler for fetching detailed information about a specific Rune.
 * Uses the `createRuneRoute` helper to standardize validation and response handling.
 */
export const GET = createRuneRoute(getRuneData, 'Failed to fetch rune info');
