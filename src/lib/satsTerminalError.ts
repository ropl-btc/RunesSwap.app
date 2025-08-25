import { createErrorResponse, handleApiError } from '@/lib/apiUtils';
import type { NextResponse } from 'next/server';

/**
 * Handles known SatsTerminal API error cases
 */
export function handleSatsTerminalError(error: unknown): NextResponse | null {
  const errorInfo = handleApiError(error, 'SatsTerminal error');
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (
    errorInfo.message.includes('Quote expired') ||
    (error &&
      typeof error === 'object' &&
      (error as { code?: string }).code === 'ERR677K3')
  ) {
    return createErrorResponse(
      'Quote expired. Please fetch a new quote.',
      errorInfo.details,
      410,
    );
  }

  if (errorMessage.includes('Rate limit') || errorInfo.status === 429) {
    return createErrorResponse(
      'Rate limit exceeded',
      'Please try again later',
      429,
    );
  }

  if (errorMessage.includes('Unexpected token')) {
    return createErrorResponse(
      'API service unavailable',
      'The SatsTerminal API is currently unavailable. Please try again later.',
      503,
    );
  }

  return null;
}
