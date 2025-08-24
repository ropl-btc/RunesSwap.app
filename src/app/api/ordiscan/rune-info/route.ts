import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, validateRequest } from '@/lib/apiUtils';
import { getRuneData } from '@/lib/runesData';
import { withApiHandler } from '@/lib/withApiHandler';
import { normalizeRuneName } from '@/utils/runeUtils';
import { logger } from '@/lib/logger';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    // const { searchParams } = new URL(request.url);
    // const name = searchParams.get('name');

    // Zod validation for 'name'
    const schema = z.object({ name: z.string().min(1) });
    const validation = await validateRequest(request, schema, 'query');
    if (!validation.success) return validation.errorResponse;
    const { name: validName } = validation.data;

    // Ensure name doesn't have spacers for the API call
    const formattedName = normalizeRuneName(validName);

    const runeInfo = await getRuneData(formattedName);

    if (!runeInfo) {
      logger.warn(`[API Route] Rune info not found for ${formattedName}`);
      // Return null data with success: true for consistent client-side handling
      return createSuccessResponse(null, 404);
    }

    return createSuccessResponse(runeInfo);
  },
  { defaultErrorMessage: 'Failed to fetch rune info' },
);
