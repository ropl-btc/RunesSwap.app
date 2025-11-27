import { createRuneRoute } from '@/app/api/ordiscan/helpers';
import { getRuneData } from '@/lib/runesData';

/**
 * GET handler for fetching detailed information about a specific Rune.
 * Uses the `createRuneRoute` helper to standardize validation and response handling.
 */
export const GET = createRuneRoute(getRuneData, 'Failed to fetch rune info');
