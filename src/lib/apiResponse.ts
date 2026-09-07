export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function fail(
  message: string,
  options?: { status?: number; code?: string; details?: string },
): Response {
  const { status = 500, code, details } = options || {};
  return Response.json(
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
