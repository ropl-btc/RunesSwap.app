import { createErrorResponse, handleApiError } from '@/lib/apiUtils';

/**
 * Handles known SatsTerminal API error cases
 */
export function handleSatsTerminalError(error: unknown): Response | null {
  const errorInfo = handleApiError(error, 'SatsTerminal error');
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (
    errorInfo.message.includes('Quote expired') ||
    (error && typeof error === 'object' && (error as { code?: string }).code === 'ERR677K3')
  ) {
    return createErrorResponse('Quote expired. Please fetch a new quote.', errorInfo.details, 410);
  }

  if (errorMessage.includes('Rate limit') || errorInfo.status === 429) {
    return createErrorResponse('Rate limit exceeded', 'Please try again later', 429);
  }

  if (
    errorMessage.includes('Unexpected token') ||
    errorMessage.includes('invalid json response body') ||
    errorMessage.includes('Service Unavailable')
  ) {
    return createErrorResponse(
      'API service unavailable',
      'The SatsTerminal API is currently unavailable. Please try again later.',
      503,
    );
  }

  if (errorMessage.includes('ReferenceError') || errorMessage.includes('apiKey is not defined')) {
    return createErrorResponse('External service error. Please try again later.', undefined, 500);
  }

  return null;
}
