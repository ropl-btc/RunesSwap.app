import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { logDbError, logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { RuneData } from '@/lib/runesData';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';

export const POST = withApiHandler(
  async (request: NextRequest) => {
    // Runtime validation schema for the rune data we return
    const responseSchema = z.object({
      id: z.string().optional(),
      name: z.string(),
      formatted_name: z.string().nullable().optional(),
      spacers: z.number().nullable().optional(),
      number: z.number().nullable().optional(),
      inscription_id: z.string().nullable().optional(),
      decimals: z.number().nullable(),
      mint_count_cap: z.string().nullable().optional(),
      symbol: z.string().nullable().optional(),
      etching_txid: z.string().nullable().optional(),
      amount_per_mint: z.string().nullable().optional(),
      timestamp_unix: z.string().nullable().optional(),
      premined_supply: z.string(),
      mint_start_block: z.number().nullable().optional(),
      mint_end_block: z.number().nullable().optional(),
      current_supply: z.string().nullable().optional(),
      current_mint_count: z.number().nullable().optional(),
    });
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
      return fail('Rune not found', { status: 404 });
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
      const maybeDetails =
        process.env.NODE_ENV !== 'production'
          ? JSON.stringify({
              code: updateError.code,
              message: updateError.message,
            })
          : undefined;

      return fail('Database update failed', {
        status: 500,
        ...(maybeDetails ? { details: maybeDetails } : {}),
      });
    }

    // No row was updated – treat as not found
    if (!updatedRows || updatedRows.length === 0) {
      logger.warn('[API Route] Update affected 0 rows', { runeName });
      return fail('Rune not found', { status: 404 });
    }

    try {
      // Prefer returning the DB-updated row to reflect canonical state
      const parsed = responseSchema.parse(updatedRows[0]);
      return ok(parsed);
    } catch (e) {
      logger.error('[API Route] Invalid rune data after update', {
        error:
          e && typeof e === 'object' && 'message' in e
            ? (e as Error).message
            : String(e),
      });
      return fail('Invalid rune data received', { status: 500 });
    }
  },
  { defaultErrorMessage: 'Failed to update rune info' },
);
