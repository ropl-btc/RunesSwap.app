import { z } from 'zod';
import { fail, ok } from '@/lib/apiResponse';
import { handleApiError, validateRequest } from '@/lib/apiUtils';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import {
  enforceLiquidiumRateLimit,
  requireLiquidiumJwt,
  resolveLiquidiumRuneId,
} from '@/server/api/liquidium/helpers';

// Schema for query parameters
const quoteParamsSchema = z.object({
  runeId: z.string().trim().min(1),
  runeAmount: z.string().min(1).regex(/^\d+$/, 'Amount must be a positive integer string'),
  address: z.string().trim().min(1), // User's address to find JWT
});

/**
 * Fetches borrower collateral rune offers (borrow quotes) for a specified rune and address.
 *
 * @param request - The Request whose query must include `runeId`, `runeAmount`, and `address`.
 * @returns An HTTP response containing the borrow quotes data on success; on failure an error response with an appropriate status and optional details (validation errors, rate-limiting, authentication failure, or SDK/API errors).
 */
export async function GET(request: Request) {
  // Validate query parameters first
  const validation = await validateRequest(request, quoteParamsSchema, 'query');
  if (!validation.success) {
    return validation.errorResponse;
  }
  // Rate limit: 30 req/min per IP
  const limited = enforceLiquidiumRateLimit(request, 'borrow:quotes');
  if (limited) return limited;

  const { runeId } = validation.data;
  const { runeAmount, address } = validation.data;

  try {
    const resolvedRuneId = await resolveLiquidiumRuneId(runeId);

    // 1. Get User JWT from Supabase
    const jwtResult = await requireLiquidiumJwt(address);
    if ('errorResponse' in jwtResult) {
      return jwtResult.errorResponse;
    }
    const userJwt = jwtResult.jwt;

    // 2. Call Liquidium API via generated SDK
    try {
      const client = createLiquidiumClient(userJwt);
      const data = await client.borrower.getApiV1BorrowerCollateralRunesOffers({
        runeId: resolvedRuneId,
        runeAmount,
      });

      return ok(data);
    } catch (sdkError) {
      const message = sdkError instanceof Error ? sdkError.message : 'Unknown error';
      return fail('Liquidium borrow quotes error', {
        status: 500,
        details: message,
      });
    }
  } catch (error) {
    const errorInfo = handleApiError(error, 'Failed to fetch borrow quotes');
    return fail(errorInfo.message, {
      status: errorInfo.status,
      ...(errorInfo.details ? { details: errorInfo.details } : {}),
    });
  }
}
