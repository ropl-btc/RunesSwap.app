import { NextRequest } from 'next/server';
import type { ConfirmPSBTParams, Order } from 'satsterminal-sdk';
import { z } from 'zod';
import { validateRequest, createSuccessResponse } from '@/lib/apiUtils';
import { handleSatsTerminalError } from '@/lib/satsTerminalError';
import { getSatsTerminalClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import { runeOrderSchema } from '@/types/satsTerminal';

const confirmPsbtParamsSchema = z.object({
  orders: z.array(runeOrderSchema),
  address: z.string().min(1, 'Bitcoin address is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  paymentAddress: z.string().min(1, 'Payment address is required'),
  paymentPublicKey: z.string().min(1, 'Payment public key is required'),
  signedPsbtBase64: z.string().min(1, 'Signed PSBT is required'),
  swapId: z.string().min(1, 'Swap ID is required'),
  runeName: z.string().min(1, 'Rune name is required'),
  sell: z.boolean().optional(),
  signedRbfPsbtBase64: z.string().optional(),
  rbfProtection: z.boolean().optional(),
});

const handler = async (request: NextRequest) => {
  const validation = await validateRequest(
    request,
    confirmPsbtParamsSchema,
    'body',
  );
  if (!validation.success) return validation.errorResponse;
  const validatedParams = validation.data;

  const terminal = getSatsTerminalClient();

  // Convert to SDK-compatible format
  const confirmParams: ConfirmPSBTParams = {
    orders: validatedParams.orders as Order[],
    address: validatedParams.address,
    publicKey: validatedParams.publicKey,
    paymentAddress: validatedParams.paymentAddress,
    paymentPublicKey: validatedParams.paymentPublicKey,
    signedPsbtBase64: validatedParams.signedPsbtBase64,
    swapId: validatedParams.swapId,
    runeName: validatedParams.runeName,
    sell: validatedParams.sell ?? false,
    rbfProtection: validatedParams.rbfProtection ?? false,
    // Only include signedRbfPsbtBase64 when RBF is enabled and a value is provided
    ...(validatedParams.rbfProtection &&
      validatedParams.signedRbfPsbtBase64 && {
        signedRbfPsbtBase64: validatedParams.signedRbfPsbtBase64,
      }),
  };

  const confirmResponse = await terminal.confirmPSBT(confirmParams);
  return createSuccessResponse(confirmResponse);
};

export const POST = withApiHandler(handler, {
  defaultErrorMessage: 'Failed to confirm PSBT',
  customErrorHandler: handleSatsTerminalError,
});
