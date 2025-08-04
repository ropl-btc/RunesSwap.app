/**
 * Server-side utility functions.
 */

import { Ordiscan } from 'ordiscan';
import { SatsTerminal } from 'satsterminal-sdk';

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
    console.error(
      'Ordiscan API key not found. Please set ORDISCAN_API_KEY environment variable on the server.',
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
export function getSatsTerminalClient(): SatsTerminal {
  const apiKey = process.env.SATS_TERMINAL_API_KEY;

  if (!apiKey) {
    console.error(
      'SatsTerminal API key not found. Please set SATS_TERMINAL_API_KEY environment variable on the server.',
    );
    throw new Error('Server configuration error: Missing SatsTerminal API Key');
  }

  const terminal = new SatsTerminal({ apiKey });

  // Create enhanced wrapper with better error handling
  return createEnhancedSatsTerminalClient(terminal);
}

/**
 * Creates an enhanced SatsTerminal client with improved error handling
 * for HTML responses, rate limiting, and better error classification.
 */
function createEnhancedSatsTerminalClient(
  terminal: SatsTerminal,
): SatsTerminal {
  // Create a proxy wrapper that intercepts method calls
  return new Proxy(terminal, {
    get(target, prop) {
      const originalMethod = target[prop as keyof SatsTerminal];

      // Only wrap async methods that make API calls
      if (
        typeof originalMethod === 'function' &&
        [
          'search',
          'popularTokens',
          'fetchQuote',
          'getPSBT',
          'confirmPSBT',
          'signIn',
          'bind',
          'points',
        ].includes(prop as string)
      ) {
        return async function (...args: unknown[]) {
          try {
            return await (
              originalMethod as (...args: unknown[]) => Promise<unknown>
            ).apply(target, args);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Handle cases where API returns HTML instead of JSON
            if (
              errorMessage.includes('Unexpected token') ||
              errorMessage.includes('invalid json response body')
            ) {
              throw new Error(
                'API service temporarily unavailable. Please try again later.',
              );
            }

            // Handle rate limiting more gracefully
            if (errorMessage.includes('Rate limit')) {
              throw new Error('Rate limit exceeded. Please try again later.');
            }

            // Handle ReferenceError from their server-side code
            if (
              errorMessage.includes('ReferenceError') ||
              errorMessage.includes('apiKey is not defined')
            ) {
              throw new Error(
                'External service error. Please try again later.',
              );
            }

            // For "No orders available" - this is a valid business response, not an error
            if (errorMessage.includes('No orders available')) {
              throw error;
            }

            // Re-throw other errors as-is
            throw error;
          }
        };
      }

      // Return original property for non-API methods
      return originalMethod;
    },
  });
}
