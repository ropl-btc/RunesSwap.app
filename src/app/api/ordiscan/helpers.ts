import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { logger } from '@/lib/logger';
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
        logger.warn('[API Route] Rune not found', {
          route: 'ordiscan',
          normalized,
        });
        return createErrorResponse('Rune not found', undefined, 404);
      }

      return createSuccessResponse(data);
    },
    { defaultErrorMessage: errorMessage },
  );
}
