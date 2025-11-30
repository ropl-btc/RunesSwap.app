import type { NextRequest } from 'next/server';
import type { GetPSBTParams, Order } from 'satsterminal-sdk';
import { z } from 'zod';

import { ok } from '@/lib/apiResponse';
import { createErrorResponse, validateRequest } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';
import { handleSatsTerminalError } from '@/lib/satsTerminalError';
import { getSatsTerminalClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import { runeOrderSchema } from '@/types/satsTerminal';

const getPsbtParamsSchema = z.object({
  orders: z.array(runeOrderSchema),
  address: z.string().trim().min(1, 'Bitcoin address is required'),
  publicKey: z.string().trim().min(1, 'Public key is required'),
  paymentAddress: z.string().trim().min(1, 'Payment address is required'),
  paymentPublicKey: z.string().trim().min(1, 'Payment public key is required'),
  runeName: z.string().trim().min(1, 'Rune name is required'),
  sell: z.boolean().optional(),
  rbfProtection: z.boolean().optional(),
  feeRate: z.number().optional(),
  slippage: z.number().optional(),
});

const handler = async (request: NextRequest) => {
  const validation = await validateRequest(
    request,
    getPsbtParamsSchema,
    'body',
  );
  if (!validation.success) return validation.errorResponse;
  const validatedParams = validation.data;

  const terminal = getSatsTerminalClient();

  // Optional override for emergency debugging; defaults to client-provided fee
  const forcedFeeRateEnv = process.env.SATS_TERMINAL_FORCED_FEE_RATE;
  const forcedFeeRate =
    forcedFeeRateEnv && !Number.isNaN(Number(forcedFeeRateEnv))
      ? Number(forcedFeeRateEnv)
      : undefined;
  const feeRate = forcedFeeRate ?? validatedParams.feeRate;

  if (!feeRate || feeRate <= 0) {
    return createErrorResponse('Invalid fee rate', undefined, 400);
  }

  const psbtParams: GetPSBTParams = {
    orders: validatedParams.orders as Order[],
    address: validatedParams.address,
    publicKey: validatedParams.publicKey,
    paymentAddress: validatedParams.paymentAddress,
    paymentPublicKey: validatedParams.paymentPublicKey,
    runeName: validatedParams.runeName,
    sell: validatedParams.sell ?? false,
    rbfProtection: validatedParams.rbfProtection ?? false,
    feeRate,
    slippage: validatedParams.slippage ?? 0,
  };

  logger.info('Requesting PSBT from SatsTerminal', {
    feeRate: psbtParams.feeRate,
    sell: psbtParams.sell,
    runeName: psbtParams.runeName,
    forcedFeeRateApplied: Boolean(forcedFeeRate),
  });
  const psbtResponse = await terminal.getPSBT(psbtParams);
  return ok(psbtResponse);
};

/**
 * POST handler for creating a PSBT (Partially Signed Bitcoin Transaction).
 * Validates the request body, retrieves the SatsTerminal client, and requests a PSBT.
 */
export const POST = withApiHandler(handler, {
  defaultErrorMessage: 'Failed to generate PSBT',
  customErrorHandler: handleSatsTerminalError,
});
