import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import type { RuneActivityEvent } from '@/types/ordiscan';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const schema = z.object({ address: z.string().trim().min(1) });
    const validation = await validateRequest(request, schema, 'query');
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { address: validAddress } = validation.data;

    const ordiscan = getOrdiscanClient();
    const activity: RuneActivityEvent[] =
      await ordiscan.address.getRunesActivity({ address: validAddress });

    const validActivity = Array.isArray(activity) ? activity : [];

    return ok(validActivity);
  },
  { defaultErrorMessage: 'Failed to fetch rune activity' },
);
