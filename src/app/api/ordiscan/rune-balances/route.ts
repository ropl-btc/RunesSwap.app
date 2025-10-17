import type { NextRequest } from 'next/server';

import { ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { requestSchemas } from '@/lib/validationSchemas';
import { withApiHandler } from '@/lib/withApiHandler';
import type { RuneBalance } from '@/types/ordiscan';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const validation = await validateRequest(
      request,
      requestSchemas.addressRequest,
      'query',
    );
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { address } = validation.data;

    const ordiscan = getOrdiscanClient();
    const balances: RuneBalance[] = await ordiscan.address.getRunes({
      address: address,
    });

    const validBalances: RuneBalance[] = Array.isArray(balances)
      ? balances
      : [];

    return ok(validBalances);
  },
  { defaultErrorMessage: 'Failed to fetch Rune balances' },
);
