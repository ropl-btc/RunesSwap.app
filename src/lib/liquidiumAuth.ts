import type { NextResponse } from 'next/server';

import { createErrorResponse } from '@/lib/apiUtils';
import { supabase } from '@/lib/supabase';
import { safeArrayFirst } from '@/utils/typeGuards';

/**
 * Retrieves a valid Liquidium JWT for the given address from Supabase.
 * Checks for existence and expiration.
 *
 * @param address - The wallet address to check.
 * @returns The JWT string if valid, or an error NextResponse.
 */
export async function getLiquidiumJwt(
  address: string,
): Promise<string | NextResponse> {
  const { data, error } = await supabase
    .from('liquidium_tokens')
    .select('jwt, expires_at')
    .eq('wallet_address', address)
    .limit(1);

  if (error) {
    return createErrorResponse(
      'Database error retrieving authentication',
      error.message,
      500,
    );
  }

  const token = safeArrayFirst(data);
  if (!token?.jwt) {
    return createErrorResponse(
      'Liquidium authentication required',
      'No JWT found for this address. Please authenticate with Liquidium first.',
      401,
    );
  }

  if (token.expires_at && new Date(token.expires_at) < new Date()) {
    return createErrorResponse(
      'Authentication expired',
      'Your authentication has expired. Please re-authenticate with Liquidium.',
      401,
    );
  }

  return token.jwt;
}
