import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/apiUtils';
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
      return createErrorResponse(
        'Missing parameters',
        'loanId and address are required',
        400,
      );
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from('liquidium_tokens')
      .select('jwt')
      .eq('wallet_address', address)
      .limit(1);
    if (tokenError) {
      return createErrorResponse(
        'Database error retrieving authentication',
        tokenError.message,
        500,
      );
    }
    const firstToken = safeArrayFirst(tokenRows);
    if (!firstToken?.jwt) {
      return createErrorResponse(
        'Liquidium authentication required',
        'No JWT found for this address',
        401,
      );
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
      return createSuccessResponse(response);
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
    return createSuccessResponse(resp);
  },
  { defaultErrorMessage: 'Failed to process repayment' },
);
