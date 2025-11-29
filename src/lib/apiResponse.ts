import { NextResponse } from 'next/server';

/** Represents a successful API response. */
export type ApiSuccess<T> = { success: true; data: T };

/** Represents a failed API response. */
export type ApiError = {
  success: false;
  error: { message: string; code?: string; details?: string };
};

/** Union type for API responses. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Creates a successful API response.
 * @param data - The data to return.
 * @param status - HTTP status code (default: 200).
 * @returns NextResponse with success payload.
 */
export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Creates a failed API response.
 * @param message - Error message.
 * @param options - Optional status code, error code, and details.
 * @returns NextResponse with error payload.
 */
export function fail(
  message: string,
  options?: { status?: number; code?: string; details?: string },
): NextResponse<ApiError> {
  const { status = 500, code, details } = options || {};
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(code ? { code } : {}),
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}
