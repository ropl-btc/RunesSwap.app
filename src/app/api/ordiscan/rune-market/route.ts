import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, validateRequest } from '@/lib/apiUtils';
import { getRuneMarketData } from '@/lib/runeMarketData';
import { withApiHandler } from '@/lib/withApiHandler';
import { normalizeRuneName } from '@/utils/runeUtils';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const schema = z.object({ name: z.string().min(1) });
    const validation = await validateRequest(request, schema, 'query');
    if (!validation.success) return validation.errorResponse;
    const { name: validName } = validation.data;

    const formattedName = normalizeRuneName(validName);

    const marketInfo = await getRuneMarketData(formattedName);

    if (!marketInfo) {
      console.warn(
        `[API Route] Rune market info not found for ${formattedName}`,
      );
      return createSuccessResponse(null, 404);
    }

    return createSuccessResponse(marketInfo);
  },
  { defaultErrorMessage: 'Failed to fetch market info' },
);
