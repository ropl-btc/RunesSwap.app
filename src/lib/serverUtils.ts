/**
 * Server-side utility functions.
 */

import { Ordiscan } from 'ordiscan';
import { SatsTerminal } from 'satsterminal-sdk';

import { logger } from '@/lib/logger';

/**
 * Gets an initialized Ordiscan SDK client instance.
 * Requires ORDISCAN_API_KEY environment variable to be set on the server.
 *
 * @throws Error if ORDISCAN_API_KEY is not set.
 * @returns Initialized Ordiscan client instance.
 */
export function getOrdiscanClient(): Ordiscan {
  const apiKey = process.env.ORDISCAN_API_KEY;

  if (!apiKey) {
    logger.error(
      'Server configuration error: Missing Ordiscan API Key',
      { service: 'ordiscan' },
      'CONFIG',
    );
    throw new Error('Server configuration error: Missing Ordiscan API Key');
  }

  // Note: The Ordiscan constructor expects the API key directly.
  return new Ordiscan(apiKey);
}

/**
 * Gets an initialized SatsTerminal SDK client instance with enhanced error handling.
 * Requires SATS_TERMINAL_API_KEY environment variable to be set on the server.
 *
 * @throws Error if SATS_TERMINAL_API_KEY is not set.
 * @returns Enhanced SatsTerminal client instance.
 */
let cachedTerminalClient: SatsTerminal | null = null;

export function getSatsTerminalClient(): SatsTerminal {
  const apiKey = process.env.SATS_TERMINAL_API_KEY;

  if (!apiKey) {
    logger.error(
      'Server configuration error: Missing SatsTerminal API Key',
      { service: 'satsterminal' },
      'CONFIG',
    );
    throw new Error('Server configuration error: Missing SatsTerminal API Key');
  }

  if (!cachedTerminalClient) {
    const terminal = new SatsTerminal({ apiKey });
    cachedTerminalClient = createEnhancedSatsTerminalClient(terminal);
  }
  return cachedTerminalClient;
}

/**
 * Simplified SatsTerminal client with basic error handling
 */
function createEnhancedSatsTerminalClient(
  terminal: SatsTerminal,
): SatsTerminal {
  const apiMethods = [
    'search',
    'popularTokens',
    'fetchQuote',
    'getPSBT',
    'confirmPSBT',
    'signIn',
    'bind',
    'points',
  ];

  // Create wrapper methods for API calls only
  const wrappedTerminal = { ...terminal };

  apiMethods.forEach((methodName) => {
    const originalMethod = terminal[methodName as keyof SatsTerminal];
    if (typeof originalMethod === 'function') {
      (wrappedTerminal as Record<string, unknown>)[methodName] = async (
        ...args: unknown[]
      ) => {
        try {
          return await (
            originalMethod as (...args: unknown[]) => Promise<unknown>
          ).apply(terminal, args);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Handle common API issues
          if (
            errorMessage.includes('Unexpected token') ||
            errorMessage.includes('invalid json response body')
          ) {
            throw new Error(
              'API service temporarily unavailable. Please try again later.',
            );
          }

          if (errorMessage.includes('Rate limit')) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }

          if (
            errorMessage.includes('ReferenceError') ||
            errorMessage.includes('apiKey is not defined')
          ) {
            throw new Error('External service error. Please try again later.');
          }

          // Re-throw other errors as-is
          throw error;
        }
      };
    }
  });

  return wrappedTerminal as SatsTerminal;
}
