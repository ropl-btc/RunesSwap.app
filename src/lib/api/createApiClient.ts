import { get, post } from '@/lib/fetchWrapper';
import { logFetchError } from '@/lib/logger';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

/**
 * Simple API client for GET requests with query parameters
 */
export function apiGet<T>(
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<T> {
  return makeApiCall('GET', endpoint, undefined, params);
}

/**
 * Simple API client for POST requests with body
 */
export function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return makeApiCall('POST', endpoint, body);
}

/**
 * Core API call handler with minimal complexity
 */
async function makeApiCall<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  let url = endpoint;

  // Add query parameters for GET requests
  if (method === 'GET' && params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  try {
    const response =
      method === 'GET'
        ? await get<ApiResponse<T>>(url)
        : await post<ApiResponse<T>>(endpoint, body);

    if (!response.data.success) {
      throw new Error('API request failed');
    }

    return response.data.data;
  } catch (error: unknown) {
    logFetchError(url, error);
    throw error;
  }
}
