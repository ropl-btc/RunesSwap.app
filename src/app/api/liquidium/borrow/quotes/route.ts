import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  validateRequest,
} from '@/lib/apiUtils';
import { createLiquidiumClient } from '@/lib/liquidiumSdk';
import { enforceRateLimit } from '@/lib/rateLimit';
import { supabase } from '@/lib/supabase';
import { getLiquidiumJwt } from '@/lib/liquidiumAuth';
import { safeArrayFirst } from '@/utils/typeGuards';

// Schema for query parameters
const quoteParamsSchema = z.object({
  runeId: z.string().trim().min(1),
  runeAmount: z
    .string()
    .min(1)
    .regex(/^\d+$/, 'Amount must be a positive integer string'),
  address: z.string().trim().min(1), // User's address to find JWT
});

export async function GET(request: NextRequest) {
  // Validate query parameters first
  const validation = await validateRequest(request, quoteParamsSchema, 'query');
  if (!validation.success) {
    return validation.errorResponse;
  }
  // Rate limit: 30 req/min per IP
  const limited = enforceRateLimit(request, {
    key: 'liquidium:borrow:quotes',
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let { runeId } = validation.data;
  const { runeAmount, address } = validation.data;

  try {
    // 0. Look up the actual rune ID from our database
    // First check if the runeId is already in the correct format (e.g., "810010:907")
    if (runeId.includes(':')) {
    } else {
      // Try to find by name first
      const { data: runeDataByName, error: runeErrorByName } = await supabase
        .from('runes')
        .select('id')
        .ilike('name', runeId)
        .limit(1);

      if (runeErrorByName) {
        console.error(
          '[API Error] Failed to fetch rune by name',
          runeErrorByName,
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
            console.error(
              '[API Error] Failed to fetch rune by ID',
              runeErrorById,
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
                  console.error(
                    '[API Error] Failed to fetch LIQUIDIUMTOKEN',
                    liquidiumError,
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

    // 1. Get User JWT from Supabase
    const jwt = await getLiquidiumJwt(address);
    if (typeof jwt !== 'string') {
      return jwt;
    }
    const userJwt = jwt;

    // 2. Call Liquidium API via generated SDK
    try {
      const client = createLiquidiumClient(userJwt);
      const data = await client.borrower.getApiV1BorrowerCollateralRunesOffers({
        runeId,
        runeAmount,
      });

      return createSuccessResponse(data);
    } catch (sdkError) {
      const message =
        sdkError instanceof Error ? sdkError.message : 'Unknown error';
      return createErrorResponse('Liquidium borrow quotes error', message, 500);
    }
  } catch (error) {
    const errorInfo = handleApiError(error, 'Failed to fetch borrow quotes');
    return createErrorResponse(
      errorInfo.message,
      errorInfo.details,
      errorInfo.status,
    );
  }
}
