import { createSuccessResponse } from '@/lib/apiUtils';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import { RuneInfo } from '@/types/ordiscan';

export const GET = withApiHandler(
  async () => {
    const ordiscan = getOrdiscanClient();
    const runes: RuneInfo[] = await ordiscan.rune.list({ sort: 'newest' });

    // Ensure we always return a valid array
    const validRunes = Array.isArray(runes) ? runes : [];

    return createSuccessResponse(validRunes);
  },
  { defaultErrorMessage: 'Failed to fetch runes list' },
);
