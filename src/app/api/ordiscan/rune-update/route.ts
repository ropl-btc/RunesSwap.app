import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { RuneData } from '@/lib/runesData';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logger, logDbError } from '@/lib/logger';

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const schema = z.object({ name: z.string().trim().min(1) });
    const validation = await validateRequest(request, schema, 'body');
    if (!validation.success) return validation.errorResponse;
    const { name: runeName } = validation.data;

    // Basic per-IP rate limit: 10 req/min for updates
    const limited = enforceRateLimit(request, {
      key: 'ordiscan:rune-update',
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const ordiscan = getOrdiscanClient();
    const runeData = await ordiscan.rune.getInfo({ name: runeName });

    if (!runeData) {
      logger.warn('[API Route] Rune info not found', { runeName });
      return createErrorResponse('Rune not found', undefined, 404);
    }

    const dataToUpdate = {
      ...runeData,
      last_updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from('runes')
      .update(dataToUpdate)
      .eq('name', runeName)
      .select();

    if (updateError) {
      logDbError('update rune data', updateError);
      logger.error('[API Route] Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return createErrorResponse(
        'Database update failed',
        process.env.NODE_ENV !== 'production'
          ? JSON.stringify({
              code: updateError.code,
              message: updateError.message,
            })
          : undefined,
        500,
      );
    }

    // No row was updated – treat as not found
    if (!updatedRows || updatedRows.length === 0) {
      logger.warn('[API Route] Update affected 0 rows', { runeName });
      return createErrorResponse('Rune not found', undefined, 404);
    }

    return createSuccessResponse(runeData as RuneData);
  },
  { defaultErrorMessage: 'Failed to update rune info' },
);
