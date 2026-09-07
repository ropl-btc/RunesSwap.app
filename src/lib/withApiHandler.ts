import { createErrorResponse, handleApiError } from '@/lib/apiUtils';

export function withApiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
  options: {
    defaultErrorMessage?: string;
    customErrorHandler?: (error: unknown) => Response | null;
  } = {},
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      const customResponse = options.customErrorHandler?.(error);
      if (customResponse) return customResponse;
      const info = handleApiError(error, options.defaultErrorMessage);
      return createErrorResponse(info.message, info.details, info.status);
    }
  };
}
