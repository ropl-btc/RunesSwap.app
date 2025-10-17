import type { NextRequest } from 'next/server';

import { fail, ok } from '@/lib/apiResponse';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';
import { safeArrayFirst } from '@/utils/typeGuards';

// POST /api/liquidium/repay
export const POST = withApiHandler(
  async (request: NextRequest) => {
    const {
      loanId,
      address,
      signedPsbt,
      feeRate: feeRateInput,
    } = await request.json();
    if (!loanId || !address) {
      return fail('Missing parameters', {
        status: 400,
        details: 'loanId and address are required',
      });
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from('liquidium_tokens')
      .select('jwt')
      .eq('wallet_address', address)
      .limit(1);
    if (tokenError) {
      return fail('Database error retrieving authentication', {
        status: 500,
        details: tokenError.message,
      });
    }
    const firstToken = safeArrayFirst(tokenRows);
    if (!firstToken?.jwt) {
      return fail('Liquidium authentication required', {
        status: 401,
        details: 'No JWT found for this address',
      });
    }
    const userJwt = firstToken.jwt;
    const client = createLiquidiumClient(userJwt);

    if (signedPsbt) {
      const response = await client.repayLoan.postApiV1BorrowerLoansRepaySubmit(
        {
          requestBody: {
            offer_id: loanId,
            signed_psbt_base_64: signedPsbt,
          },
        },
      );
      return ok(response);
    }

    const DEFAULT_FEE_RATE = 5;
    const feeRate =
      typeof feeRateInput === 'number' && feeRateInput > 0
        ? feeRateInput
        : DEFAULT_FEE_RATE;

    const resp = await client.repayLoan.postApiV1BorrowerLoansRepayPrepare({
      requestBody: {
        offer_id: loanId,
        fee_rate: feeRate,
      },
    });
    return ok(resp);
  },
  { defaultErrorMessage: 'Failed to process repayment' },
);
