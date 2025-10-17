import { NextResponse } from 'next/server';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { message: string; code?: string; details?: string };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

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
