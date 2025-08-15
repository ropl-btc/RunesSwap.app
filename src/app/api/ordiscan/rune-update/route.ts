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

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const schema = z.object({ name: z.string().min(1) });
    const validation = await validateRequest(request, schema, 'body');
    if (!validation.success) return validation.errorResponse;
    const { name: runeName } = validation.data;

    const ordiscan = getOrdiscanClient();
    const runeData = await ordiscan.rune.getInfo({ name: runeName });

    if (!runeData) {
      console.warn(`[API Route] Rune info not found for ${runeName}`);
      return createSuccessResponse(null, 404);
    }

    const dataToUpdate = {
      ...runeData,
      last_updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('runes')
      .update(dataToUpdate)
      .eq('name', runeName)
      .select();

    if (updateError) {
      console.error('[API Route] Error updating rune data:', updateError);
      console.error('[API Route] Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return createErrorResponse(
        'Database update failed',
        JSON.stringify(updateError),
        500,
      );
    }

    return createSuccessResponse(runeData as RuneData);
  },
  { defaultErrorMessage: 'Failed to update rune info' },
);
