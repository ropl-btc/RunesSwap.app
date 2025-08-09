export const handleApiResponse = <T>(
  data: unknown,
  expectedArrayType = false,
): T => {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as Record<string, unknown>).success === true &&
    'data' in data
  ) {
    const responseData = (data as { data: unknown }).data;
    if (expectedArrayType && !Array.isArray(responseData)) {
      return [] as unknown as T;
    }
    return responseData as T;
  }
  if (
    (expectedArrayType && Array.isArray(data)) ||
    (!expectedArrayType && data !== null)
  ) {
    return data as T;
  }
  return (expectedArrayType ? [] : null) as unknown as T;
};

// Extracts an error message from common API error payload shapes
export const getErrorMessageFromData = (
  data: unknown,
  fallback: string,
): string => {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    (data as Record<string, unknown>).error
  ) {
    const err = (data as Record<string, unknown>).error;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }
  }
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as Record<string, unknown>).message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
};
