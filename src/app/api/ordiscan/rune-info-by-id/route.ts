import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/apiUtils';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');

    if (!prefix) {
      return createErrorResponse(
        'Missing required parameter: prefix',
        undefined,
        400,
      );
    }

    const { data: existingRune } = await supabase
      .from('runes')
      .select('*')
      .eq('id', prefix)
      .limit(1);

    if (!existingRune || existingRune.length === 0) {
      const { data: prefixRune } = await supabase
        .from('runes')
        .select('*')
        .ilike('id', `${prefix}:%`)
        .limit(1);

      if (prefixRune && prefixRune.length > 0) {
        return createSuccessResponse(prefixRune[0]);
      }
    }

    if (existingRune && existingRune.length > 0) {
      return createSuccessResponse(existingRune[0]);
    }

    return createErrorResponse(
      'Rune not found with the given prefix',
      undefined,
      404,
    );
  },
  { defaultErrorMessage: 'Failed to fetch rune info by ID' },
);
