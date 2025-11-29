import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/apiResponse';
import { handleApiError, validateRequest } from '@/lib/apiUtils';
import { getLiquidiumJwt } from '@/lib/liquidiumAuth';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { enforceRateLimit } from '@/lib/rateLimit';
import type { StartLoanService } from '@/sdk/liquidium/services/StartLoanService';

// Schema for request body
const submitBodySchema = z.object({
  signed_psbt_base_64: z.string().trim().min(1),
  prepare_offer_id: z.string().uuid(),
  address: z.string().trim().min(1), // User's address to find JWT
});

/**
 * Handles POST requests to submit a borrow transaction to the Liquidium API.
 *
 * Validates the request body (expects `signed_psbt_base_64`, `prepare_offer_id`, and `address`), enforces per-IP rate limiting, retrieves a user JWT, and forwards the submission to the Liquidium SDK.
 *
 * @param request - NextRequest whose JSON body must include:
 *   - `signed_psbt_base_64`: a non-empty Base64-encoded PSBT string
 *   - `prepare_offer_id`: the offer UUID to submit against
 *   - `address`: the user address used to obtain a Liquidium JWT
 * @returns An API response payload: on success the Liquidium SDK response wrapped with `ok(...)`; on failure a validation error, rate-limit response, or a formatted error via `fail(...)`.
 */
export async function POST(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, submitBodySchema, 'body');
  if (!validation.success) {
    return validation.errorResponse;
  }
  // Rate limit: 30 req/min per IP
  const limited = enforceRateLimit(request, {
    key: 'liquidium:borrow:submit',
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

    // 2. Call Liquidium API via SDK
    try {
      const client = createLiquidiumClient(userJwt);

      type SubmitRequest = Parameters<
        StartLoanService['postApiV1BorrowerLoansStartSubmit']
      >[0]['requestBody'];

      const sdkPayload: SubmitRequest = {
        signed_psbt_base_64: liquidiumPayload.signed_psbt_base_64,
        prepare_offer_id: liquidiumPayload.prepare_offer_id,
      };

      const response = await client.startLoan.postApiV1BorrowerLoansStartSubmit(
        {
          requestBody: sdkPayload,
        },
      );

      return ok(response);
    } catch (error) {
      const errorInfo = handleApiError(
        error,
        'Failed to submit borrow transaction',
      );
      return fail(errorInfo.message, {
        status: errorInfo.status,
        ...(errorInfo.details ? { details: errorInfo.details } : {}),
      });
    }
  } catch (error) {
    const errorInfo = handleApiError(
      error,
      'Failed to submit borrow transaction',
    );
    return fail(errorInfo.message, {
      status: errorInfo.status,
      ...(errorInfo.details ? { details: errorInfo.details } : {}),
    });
  }
}
