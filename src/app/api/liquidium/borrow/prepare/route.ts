import type { NextRequest } from 'next/server';
import { z } from 'zod';

import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { getLiquidiumJwt } from '@/lib/liquidiumAuth';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { StartLoanService } from '@/sdk/liquidium/services/StartLoanService';

// Schema for request body
const prepareBodySchema = z.object({
  instant_offer_id: z.string().uuid(),
  fee_rate: z.number().positive(),
  token_amount: z
    .string()
    .min(1)
    .regex(/^\d+$/, 'Token amount must be a positive integer string'),
  borrower_payment_address: z.string().trim().min(1),
  borrower_payment_pubkey: z.string().trim().min(1),
  borrower_ordinal_address: z.string().trim().min(1),
  borrower_ordinal_pubkey: z.string().trim().min(1),
  collateral_asset_id: z.string().optional(), // Optional field for rune ID
  address: z.string().trim().min(1), // User's address to find JWT
});

type StartLoanPrepareRequest = Parameters<
  StartLoanService['postApiV1BorrowerLoansStartPrepare']
>[0]['requestBody'];

export async function POST(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, prepareBodySchema, 'body');
  if (!validation.success) {
    return validation.errorResponse;
  }
  // Rate limit: 30 req/min per IP
  const limited = enforceRateLimit(request, {
    key: 'liquidium:borrow:prepare',
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;
  // Exclude 'address' from the data sent to Liquidium
  const { address, ...liquidiumPayload } = validation.data;

  try {
    // 1. Get User JWT from Supabase
    const jwt = await getLiquidiumJwt(address);
    if (typeof jwt !== 'string') {
      return jwt;
    }
    const userJwt = jwt;

    // Include required wallet field
    const sdkPayload: StartLoanPrepareRequest = {
      instant_offer_id: liquidiumPayload.instant_offer_id,
      fee_rate: liquidiumPayload.fee_rate,
      token_amount: liquidiumPayload.token_amount,
      borrower_payment_address: liquidiumPayload.borrower_payment_address,
      borrower_payment_pubkey: liquidiumPayload.borrower_payment_pubkey,
      borrower_ordinal_address: liquidiumPayload.borrower_ordinal_address,
      borrower_ordinal_pubkey: liquidiumPayload.borrower_ordinal_pubkey,
      borrower_wallet: 'xverse',
    };

    // 2. Call Liquidium API via SDK
    const client = createLiquidiumClient(userJwt);
    const response = await client.startLoan.postApiV1BorrowerLoansStartPrepare({
      requestBody: sdkPayload,
    });

    return createSuccessResponse(response);
  } catch (sdkError) {
    const message =
      sdkError instanceof Error ? sdkError.message : 'Unknown error';
    return createErrorResponse('Liquidium prepare borrow error', message, 500);
  }
}
