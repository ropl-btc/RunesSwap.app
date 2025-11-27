import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/apiResponse';
import { handleApiError, validateRequest } from '@/lib/apiUtils';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import type { BorrowerService } from '@/sdk/liquidium/services/BorrowerService';
import { safeArrayAccess, safeArrayFirst } from '@/utils/typeGuards';

// Schema for query parameters
const rangeParamsSchema = z.object({
  runeId: z.string().trim().min(1),
  address: z.string().trim().min(1), // User's address to find JWT
});

/**
 * Handle GET requests to fetch borrow amount ranges for a rune and wallet address.
 *
 * Validates query parameters, resolves the canonical rune ID (by exact ID, name, ID prefix, or special-case LIQUIDIUMTOKEN), returns a recent cached range if available, or fetches fresh range data from the Liquidium API using the authenticated user's JWT stored in Supabase. On success returns the computed min/max borrow amounts, optional loan term days, cache flag, and timestamp; handles missing offers, authentication, and database or API errors with structured fail responses.
 *
 * @param request - Incoming NextRequest containing query parameters `runeId` and `address`
 * @returns An object for successful responses containing:
 *  - `runeId`: the canonical rune identifier used
 *  - `minAmount`: smallest allowed borrow amount as a string
 *  - `maxAmount`: largest allowed borrow amount as a string
 *  - `loanTermDays?`: optional array of supported loan term days
 *  - `cached`: `true` if the response was served from a recent cache, `false` otherwise
 *  - `updatedAt`: ISO timestamp of when the range was determined
 *  - `noOffersAvailable?`: present and `true` when the Liquidium API indicates no offers (in which case `minAmount` and `maxAmount` are `"0"`)
 *
 * Failure responses use the standardized fail shape with a message, HTTP `status`, and optional `details`.
 */
export async function GET(request: NextRequest) {
  // Validate query parameters first
  const validation = await validateRequest(request, rangeParamsSchema, 'query');
  if (!validation.success) {
    return validation.errorResponse;
  }

  let { runeId } = validation.data;
  const { address } = validation.data;

  try {
    // 0. Look up the actual rune ID from our database
    if (runeId.includes(':')) {
      // Already in correct format
    } else {
      // Try to find by name first
      const { data: runeDataByName, error: runeErrorByName } = await supabase
        .from('runes')
        .select('id')
        .ilike('name', runeId)
        .limit(1);

      if (runeErrorByName) {
        logger.error(
          'Failed to fetch rune by name',
          { error: runeErrorByName },
          'API',
        );
      } else {
        const firstRuneByName = safeArrayFirst(runeDataByName);
        if (firstRuneByName?.id) {
          runeId = firstRuneByName.id;
        } else {
          // If not found by name, try to find by ID prefix
          const { data: runeDataById, error: runeErrorById } = await supabase
            .from('runes')
            .select('id')
            .ilike('id', `${runeId}:%`)
            .limit(1);

          if (runeErrorById) {
            logger.error(
              'Failed to fetch rune by ID',
              { error: runeErrorById },
              'API',
            );
          } else {
            const firstRuneById = safeArrayFirst(runeDataById);
            if (firstRuneById?.id) {
              runeId = firstRuneById.id;
            } else {
              // Special case for LIQUIDIUMTOKEN
              if (runeId.toLowerCase() === 'liquidiumtoken') {
                const { data: liquidiumData, error: liquidiumError } =
                  await supabase
                    .from('runes')
                    .select('id')
                    .eq('name', 'LIQUIDIUMTOKEN')
                    .limit(1);

                if (liquidiumError) {
                  logger.error(
                    'Failed to fetch LIQUIDIUMTOKEN',
                    { error: liquidiumError },
                    'API',
                  );
                } else {
                  const firstLiquidiumData = safeArrayFirst(liquidiumData);
                  if (firstLiquidiumData?.id) {
                    runeId = firstLiquidiumData.id;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Check if we have a cached range that's less than 5 minutes old
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: cachedRanges, error: cachedRangesError } = await supabase
      .from('rune_borrow_ranges')
      .select('*')
      .eq('rune_id', runeId)
      .gt('updated_at', fiveMinutesAgo.toISOString())
      .limit(1);

    if (!cachedRangesError && cachedRanges && cachedRanges.length > 0) {
      return ok({
        runeId,
        minAmount: cachedRanges[0].min_amount,
        maxAmount: cachedRanges[0].max_amount,
        cached: true,
        updatedAt: cachedRanges[0].updated_at,
      });
    }

    // 1. Get User JWT from Supabase
    const { data: tokenRows, error: tokenError } = await supabase
      .from('liquidium_tokens')
      .select('jwt, expires_at')
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
        details:
          'No JWT found for this address. Please authenticate with Liquidium first.',
      });
    }

    const userJwt = firstToken.jwt;
    const expiresAt = firstToken.expires_at;

    // Check if JWT is expired
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return fail('Authentication expired', {
        status: 401,
        details:
          'Your authentication has expired. Please re-authenticate with Liquidium.',
      });
    }

    // We'll use a dummy amount of 1 to get the valid ranges
    const dummyAmount = '1';

    // Response type helpers from the Liquidium SDK (needs to be declared
    // before we receive the response so we can type the variable correctly)
    type OffersResp = Awaited<
      ReturnType<BorrowerService['getApiV1BorrowerCollateralRunesOffers']>
    >;

    /*
     * Older versions of the API returned `valid_ranges` at the top level.
     * Keep a lightweight definition so we can safely support both shapes
     * without falling back to `any`.
     */
    type LegacyRanges = {
      valid_ranges: OffersResp['runeDetails']['valid_ranges'];
    };

    type LiquidiumRangeResp = OffersResp | LegacyRanges;

    let liquidiumData: LiquidiumRangeResp;

    try {
      const client = createLiquidiumClient(userJwt);
      liquidiumData =
        await client.borrower.getApiV1BorrowerCollateralRunesOffers({
          runeId,
          runeAmount: dummyAmount,
        });
    } catch (sdkError) {
      const message =
        sdkError instanceof Error ? sdkError.message : 'Unknown error';

      // Handle 404 gracefully - this means no offers are available for this rune
      if (message.includes('Not Found') || message.includes('404')) {
        return ok({
          runeId,
          minAmount: '0',
          maxAmount: '0',
          loanTermDays: [],
          cached: false,
          updatedAt: new Date().toISOString(),
          noOffersAvailable: true,
        });
      }

      return fail('Liquidium API error', { status: 500, details: message });
    }

    // We now have a typed Liquidium response, extract the valid ranges
    let validRanges: OffersResp['runeDetails']['valid_ranges'];

    if ('valid_ranges' in liquidiumData) {
      // Legacy response shape
      validRanges = (liquidiumData as LegacyRanges).valid_ranges;
    } else if ('runeDetails' in liquidiumData) {
      validRanges = (liquidiumData as OffersResp).runeDetails.valid_ranges;
    } else {
      throw new Error('valid_ranges field not found in Liquidium response');
    }

    // Helper function to process ranges and extract min/max values
    interface RangeData {
      min: string;
      max: string;
    }

    function processRanges(ranges: RangeData[]): { min: string; max: string } {
      if (!Array.isArray(ranges) || ranges.length === 0) {
        throw new Error('No valid ranges found');
      }

      const firstRange = safeArrayFirst(ranges);
      if (!firstRange?.min || !firstRange?.max) {
        throw new Error('Range data is missing required fields');
      }

      let globalMin = BigInt(firstRange.min);
      let globalMax = BigInt(firstRange.max);

      for (let i = 1; i < ranges.length; i++) {
        const currentRange = safeArrayAccess(ranges, i);
        if (!currentRange?.min || !currentRange?.max) {
          logger.warn(`Skipping invalid range at index ${i}`, undefined, 'API');
          continue;
        }

        const currentMin = BigInt(currentRange.min);
        const currentMax = BigInt(currentRange.max);
        if (currentMin < globalMin) globalMin = currentMin;
        if (currentMax > globalMax) globalMax = currentMax;
      }

      return {
        min: globalMin.toString(),
        max: globalMax.toString(),
      };
    }

    // 5. Extract the min-max range from the response
    let minAmount = '0';
    let maxAmount = '0';
    let loanTermDays: number[] = [];

    try {
      const processedRanges = processRanges(validRanges.rune_amount.ranges);
      minAmount = processedRanges.min;
      maxAmount = processedRanges.max;

      // Store loan term days if available
      if (validRanges.loan_term_days) {
        loanTermDays = validRanges.loan_term_days;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error processing ranges';
      return fail('Invalid range data', { status: 500, details: errorMessage });
    }

    // Store the range in the database
    const { error: upsertError } = await supabase
      .from('rune_borrow_ranges')
      .upsert(
        {
          rune_id: runeId,
          min_amount: minAmount,
          max_amount: maxAmount,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'rune_id',
        },
      );
    if (upsertError) {
      logger.warn('Failed to upsert rune_borrow_ranges', {
        error: upsertError,
        runeId,
      });
    }

    // Return successful response
    return ok({
      runeId,
      minAmount,
      maxAmount,
      loanTermDays,
      cached: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorInfo = handleApiError(error, 'Failed to fetch borrow ranges');
    return fail(errorInfo.message, {
      status: errorInfo.status,
      ...(errorInfo.details ? { details: errorInfo.details } : {}),
    });
  }
}
