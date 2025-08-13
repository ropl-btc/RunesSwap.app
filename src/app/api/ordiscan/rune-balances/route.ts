import { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  validateRequest,
} from '@/lib/apiUtils';
import { getOrdiscanClient } from '@/lib/serverUtils';
import { requestSchemas } from '@/lib/validationSchemas';
import { RuneBalance } from '@/types/ordiscan';

export async function GET(request: NextRequest) {
  const validation = await validateRequest(
    request,
    requestSchemas.addressRequest,
    'query',
  );
  if (!validation.success) {
    return validation.errorResponse;
  }
  const { address } = validation.data;

  try {
    const ordiscan = getOrdiscanClient();
    const balances: RuneBalance[] = await ordiscan.address.getRunes({
      address: address,
    });

    // Ensure we always return a valid array
    const validBalances: RuneBalance[] = Array.isArray(balances)
      ? balances
      : [];

    // Transform response to match documented API format (amount -> balance)
    const formattedBalances = validBalances.map((balance) => ({
      name: balance.name,
      balance:
        (balance as { amount?: string; balance?: string }).amount ||
        (balance as { amount?: string; balance?: string }).balance, // Support both formats for backward compatibility
    }));

    return createSuccessResponse(formattedBalances);
  } catch (error) {
    const errorInfo = handleApiError(
      error,
      `Failed to fetch Rune balances for ${address}`,
    );
    return createErrorResponse(
      errorInfo.message,
      errorInfo.details,
      errorInfo.status,
    );
  }
}
