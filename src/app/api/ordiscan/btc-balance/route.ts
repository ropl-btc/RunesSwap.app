import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, validateRequest } from '@/lib/apiUtils';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const schema = z.object({ address: z.string().min(1) });
    const validation = await validateRequest(request, schema, 'query');
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { address } = validation.data;

    const ordiscan = getOrdiscanClient();
    const utxos = await ordiscan.address.getUtxos({ address: address });

    if (!Array.isArray(utxos)) {
      console.warn(
        `[API Route] Invalid or empty UTXO data received for address ${address}. Expected array, got:`,
        utxos,
      );
      return createSuccessResponse({ balance: 0 });
    }

    const totalBalance = utxos.reduce(
      (sum, utxo) => sum + (utxo.value || 0),
      0,
    );
    return createSuccessResponse({ balance: totalBalance });
  },
  { defaultErrorMessage: 'Failed to fetch BTC balance' },
);
