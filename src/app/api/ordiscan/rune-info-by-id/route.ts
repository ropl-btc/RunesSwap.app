import type { NextRequest } from 'next/server';

import { fail,ok } from '@/lib/apiResponse';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');

    if (!prefix)
      return fail('Missing required parameter: prefix', { status: 400 });

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

      if (prefixRune && prefixRune.length > 0) return ok(prefixRune[0]);
    }

    if (existingRune && existingRune.length > 0) return ok(existingRune[0]);

    return fail('Rune not found with the given prefix', { status: 404 });
  },
  { defaultErrorMessage: 'Failed to fetch rune info by ID' },
);
