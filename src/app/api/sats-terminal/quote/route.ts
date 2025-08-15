import { NextRequest } from 'next/server';
import type { QuoteParams } from 'satsterminal-sdk';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
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
    };

    const quoteResponse = await terminal.fetchQuote(quoteParams);

    return createSuccessResponse(quoteResponse);
  },
  {
    defaultErrorMessage: 'Failed to fetch quote',
    customErrorHandler: (error: unknown) => {
      // Special handling for liquidity errors (maintain 404 status)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes('liquidity')) {
        return createErrorResponse('No liquidity available', errorMessage, 404);
      }

      // Special handling for rate limiting
      if (errorMessage.includes('Rate limit')) {
        return createErrorResponse(
          'Rate limit exceeded',
          'Please try again later',
          429,
        );
      }

      // Handle unexpected token errors (HTML responses instead of JSON)
      if (errorMessage.includes('Unexpected token')) {
        return createErrorResponse(
          'API service unavailable',
          'The SatsTerminal API is currently unavailable. Please try again later.',
          503,
        );
      }

      // Return null to fall back to default error handling
      return null;
    },
  },
);
