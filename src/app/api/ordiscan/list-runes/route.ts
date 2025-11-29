import { ok } from '@/lib/apiResponse';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import type { RuneInfo } from '@/types/ordiscan';

/**
 * GET handler for listing the newest Runes.
 * Fetches a list of Runes from Ordiscan sorted by newest.
 */
export const GET = withApiHandler(
  async () => {
    const ordiscan = getOrdiscanClient();
    const runes: RuneInfo[] = await ordiscan.rune.list({ sort: 'newest' });

    // Ensure we always return a valid array
    const validRunes = Array.isArray(runes) ? runes : [];

    return ok(validRunes);
  },
  { defaultErrorMessage: 'Failed to fetch runes list' },
);
