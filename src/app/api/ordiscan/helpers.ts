import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSuccessResponse, validateRequest } from '@/lib/apiUtils';
import { validators } from '@/lib/validationSchemas';
import { withApiHandler } from '@/lib/withApiHandler';
import { normalizeRuneName } from '@/utils/runeUtils';

export function createRuneRoute<T>(
  fetcher: (rune: string) => Promise<T | null>,
  errorMessage: string,
) {
  return withApiHandler(
    async (request: NextRequest) => {
      const schema = z.object({ name: validators.runeName });
      const validation = await validateRequest(request, schema, 'query');
      if (!validation.success) return validation.errorResponse;
      const { name } = validation.data;

      const normalized = normalizeRuneName(name);
      const data = await fetcher(normalized);

      if (!data) {
        console.warn(`[API Route] ${errorMessage}: ${normalized} not found`);
        return createSuccessResponse(null, 404);
      }

      return createSuccessResponse(data);
    },
    { defaultErrorMessage: errorMessage },
  );
}
