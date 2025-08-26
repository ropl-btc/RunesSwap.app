import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { supabase } from '@/lib/supabase';
import { withApiHandler } from '@/lib/withApiHandler';
import { enforceRateLimit } from '@/lib/rateLimit';
import { safeParseJWT } from '@/utils/typeGuards';

const AuthSchema = z.object({
  ordinalsAddress: z.string().trim().min(1),
  paymentAddress: z.string().trim().min(1),
  ordinalsSignature: z.string().trim().min(1),
  paymentSignature: z.string().optional(),
  ordinalsNonce: z.string().trim().min(1),
  paymentNonce: z.string().optional(),
});

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const validation = await validateRequest(request, AuthSchema, 'body');
    if (!validation.success) return validation.errorResponse;
    // Rate limit: 30 req/min per IP
    const limited = enforceRateLimit(request, {
      key: 'liquidium:auth',
      limit: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const {
      ordinalsAddress,
      paymentAddress,
      ordinalsSignature,
      paymentSignature,
      ordinalsNonce,
      paymentNonce,
    } = validation.data;

    const client = createLiquidiumClient();

    const submitData = {
      ordinals: {
        address: ordinalsAddress,
        signature: ordinalsSignature,
        nonce: ordinalsNonce,
      },
      ...(paymentSignature && paymentNonce
        ? {
            payment: {
              address: paymentAddress,
              signature: paymentSignature,
              nonce: paymentNonce,
            },
          }
        : {}),
    };

    const authSubmitResponse = await client.authentication.postApiV1AuthSubmit({
      requestBody: submitData,
    });

    let expiresAt: Date | null = null;
    const payload = safeParseJWT(authSubmitResponse.user_jwt);
    if (payload && typeof payload.exp === 'number') {
      expiresAt = new Date(payload.exp * 1000);
    } else {
      console.warn(
        '[API Debug] Failed to decode JWT for expiry: Invalid payload structure',
      );
    }

    const upsertData = {
      wallet_address: ordinalsAddress,
      ordinals_address: ordinalsAddress,
      payment_address: paymentAddress,
      jwt: authSubmitResponse.user_jwt,
      expires_at: expiresAt,
      last_used_at: new Date().toISOString(),
    };
    console.info('[API Debug] Upserting Liquidium JWT with data:', upsertData);

    const { error, data: upsertResult } = await supabase
      .from('liquidium_tokens')
      .upsert(upsertData, { onConflict: 'wallet_address' });

    if (error) {
      console.error('[API Error] Failed to store Liquidium JWT', error);
      return createErrorResponse(
        'Failed to store Liquidium JWT',
        JSON.stringify(error),
        500,
      );
    }
    console.info('[API Debug] Upsert result:', upsertResult);
    return createSuccessResponse({ jwt: authSubmitResponse.user_jwt });
  },
  { defaultErrorMessage: 'Liquidium authentication failed' },
);
