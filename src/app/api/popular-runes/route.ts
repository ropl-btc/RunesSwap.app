import { ok } from '@/lib/apiResponse';
import { getPopularRunes } from '@/lib/popularRunes';
import { withApiHandler } from '@/lib/withApiHandler';

export const dynamic = 'force-static';

/**
 * Returns the popular runes list
 * This is now a simple hardcoded list that you can easily maintain
 */
export const GET = withApiHandler(
  async () => {
    const popularRunes = getPopularRunes();
    return ok(popularRunes);
  },
  { defaultErrorMessage: 'Failed to fetch popular runes' },
);
