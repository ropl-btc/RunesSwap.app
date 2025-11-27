import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';

/**
 * GET handler for fetching BTC balance of an address.
 * Validates the address and sums up UTXO values.
 */
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const balanceResponseSchema = z.object({
      balance: z.number().nonnegative(),
    });
    const schema = z.object({ address: z.string().trim().min(1) });
    const validation = await validateRequest(request, schema, 'query');
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { address } = validation.data;

    const ordiscan = getOrdiscanClient();
    const utxos = await ordiscan.address.getUtxos({ address: address });

    if (!Array.isArray(utxos)) {
      logger.warn(
        `[API Route] Invalid or empty UTXO data received for address ${address}. Expected array, got:`,
        { utxos },
      );
      return ok(balanceResponseSchema.parse({ balance: 0 }));
    }

    const totalBalance = utxos.reduce(
      (sum, utxo) => sum + (utxo.value || 0),
      0,
    );
    return ok(balanceResponseSchema.parse({ balance: totalBalance }));
  },
  { defaultErrorMessage: 'Failed to fetch BTC balance' },
);
