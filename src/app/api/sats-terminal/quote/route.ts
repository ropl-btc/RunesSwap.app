import type { NextRequest } from 'next/server';
import type { QuoteParams } from 'satsterminal-sdk';

import { fail, ok } from '@/lib/apiResponse';
import { validateRequest } from '@/lib/apiUtils';
import { getSatsTerminalClient } from '@/lib/serverUtils';
import { requestSchemas } from '@/lib/validationSchemas';
import { withApiHandler } from '@/lib/withApiHandler';
import { normalizeRuneName } from '@/utils/runeUtils';

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const validation = await validateRequest(
      request,
      requestSchemas.quoteRequest,
      'body',
    );
    if (!validation.success) return validation.errorResponse;

    const { btcAmount, address, runeName, sell } = validation.data;

    const terminal = getSatsTerminalClient();

    // Normalize the rune name to remove spacers (bullet characters)
    const normalizedRuneName = normalizeRuneName(runeName);

    // Convert to SDK-compatible format by ensuring all optional fields have defaults
    const quoteParams: QuoteParams = {
      btcAmount: String(btcAmount),
      address,
      runeName: normalizedRuneName,
      sell: sell ?? false,
      // Enable AMM fallback when selling to reduce confirm failures from no-fill
      ...(sell ? { fill: true } : {}),
    };

    const quoteResponse = await terminal.fetchQuote(quoteParams);
    return ok(quoteResponse);
  },
  {
    defaultErrorMessage: 'Failed to fetch quote',
    customErrorHandler: (error: unknown) => {
      // Special handling for liquidity errors (maintain 404 status)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('liquidity')) {
        return fail('No liquidity available', {
          status: 404,
          details: errorMessage,
        });
      }

      // Special handling for rate limiting
      if (errorMessage.includes('Rate limit')) {
        return fail('Rate limit exceeded', {
          status: 429,
          details: 'Please try again later',
        });
      }

      // Handle unexpected token errors (HTML responses instead of JSON)
      if (errorMessage.includes('Unexpected token')) {
        return fail('API service unavailable', {
          status: 503,
          details:
            'The SatsTerminal API is currently unavailable. Please try again later.',
        });
      }

      // Map common sell/no-order conditions to 404 for clearer UX
      if (
        errorMessage.includes('No marketplace found for your sell order') ||
        errorMessage.includes('No valid orders') ||
        errorMessage.toLowerCase().includes('no marketplace found')
      ) {
        return fail('No orders available for this trade', {
          status: 404,
          details: errorMessage,
        });
      }

      // Return null to fall back to default error handling
      return null;
    },
  },
);
