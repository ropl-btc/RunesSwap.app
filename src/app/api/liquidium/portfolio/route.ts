import type { NextRequest } from 'next/server';

import { fail, ok } from '@/lib/apiResponse';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';
import { safeArrayFirst } from '@/utils/typeGuards';

// GET /api/liquidium/portfolio?address=...
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    if (!address) {
      return fail('Missing address', {
        status: 400,
        details: 'address query param is required',
      });
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from('liquidium_tokens')
      .select('jwt')
      .eq('wallet_address', address)
      .limit(1);
    if (tokenError) {
      console.error('[Liquidium] Supabase error:', tokenError);
      return fail('Database error retrieving authentication', {
        status: 500,
        details: tokenError.message,
      });
    }
    const firstToken = safeArrayFirst(tokenRows);
    if (!firstToken?.jwt) {
      console.warn('[Liquidium] No JWT found for address:', address);
      return fail('Liquidium authentication required', {
        status: 401,
        details: 'No JWT found for this address',
      });
    }
    const userJwt = firstToken.jwt;
    const client = createLiquidiumClient(userJwt);
    const portfolio = await client.portfolio.getApiV1Portfolio();

    const loans =
      portfolio?.borrower?.runes?.loans ??
      portfolio?.lender?.runes?.loans ??
      [];

    return ok({
      loans,
      rawPortfolio: portfolio,
    });
  },
  { defaultErrorMessage: 'Failed to fetch Liquidium portfolio' },
);
