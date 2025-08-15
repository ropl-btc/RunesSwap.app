import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/apiUtils';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { withApiHandler } from '@/lib/withApiHandler';

// GET /api/liquidium/challenge?ordinalsAddress=...&paymentAddress=...
export const GET = withApiHandler(
  async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const ordinalsAddress = searchParams.get('ordinalsAddress');
    const paymentAddress = searchParams.get('paymentAddress');
    if (!ordinalsAddress || !paymentAddress) {
      return createErrorResponse(
        'Missing addresses',
        'Both ordinalsAddress and paymentAddress are required',
        400,
      );
    }
    const walletParam = searchParams.get('wallet') || 'xverse';

    const client = createLiquidiumClient();
    const challenge = await client.authentication.postApiV1AuthPrepare({
      requestBody: {
        payment_address: paymentAddress,
        ordinals_address: ordinalsAddress,
        wallet: walletParam,
      },
    });
    return createSuccessResponse(challenge);
  },
  { defaultErrorMessage: 'Failed to get Liquidium challenge' },
);
