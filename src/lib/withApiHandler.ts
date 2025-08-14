import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, handleApiError } from './apiUtils';

/**
 * Handler function type that accepts a request and returns a NextResponse
 */
type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Handler function type for GET requests (no request parameter needed)
 */
type GetApiHandler = () => Promise<NextResponse>;

/**
 * Custom error handler function type
 */
type CustomErrorHandler = (error: unknown) => NextResponse | null;

/**
 * Configuration options for the API handler wrapper
 */
interface ApiHandlerOptions {
  defaultErrorMessage?: string;
  customErrorHandler?: CustomErrorHandler;
}

/**
 * Higher-order function that wraps API route handlers with automatic error handling
 */
export function withApiHandler(
  handler: ApiHandler,
  options?: ApiHandlerOptions,
): ApiHandler;

export function withApiHandler(
  handler: GetApiHandler,
  options?: ApiHandlerOptions,
): GetApiHandler;

export function withApiHandler(
  handler: ApiHandler | GetApiHandler,
  options: ApiHandlerOptions = {},
): ApiHandler | GetApiHandler {
  const { defaultErrorMessage = 'An error occurred', customErrorHandler } =
    options;

  return async (request?: NextRequest) => {
    try {
      if (request !== undefined) {
        return await (handler as ApiHandler)(request);
      } else {
        return await (handler as GetApiHandler)();
      }
    } catch (error: unknown) {
      if (customErrorHandler) {
        const customResponse = customErrorHandler(error);
        if (customResponse) {
          return customResponse;
        }
      }

      const errorInfo = handleApiError(error, defaultErrorMessage);
      return createErrorResponse(
        errorInfo.message,
        errorInfo.details,
        errorInfo.status,
      );
    }
  };
}
