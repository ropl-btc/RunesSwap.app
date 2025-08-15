import { createSuccessResponse } from '@/lib/apiUtils';
import { getPopularRunes } from '@/lib/popularRunes';
import { withApiHandler } from '@/lib/withApiHandler';

/**
 * Returns the popular runes list
 * This is now a simple hardcoded list that you can easily maintain
 */
export const GET = withApiHandler(
  async () => {
    const popularRunes = getPopularRunes();
    return createSuccessResponse(popularRunes);
  },
  { defaultErrorMessage: 'Failed to fetch popular runes' },
);
