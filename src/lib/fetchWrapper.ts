/**
 * Standardized fetch wrapper with retry logic, timeout, and error handling
 * Follows DRY principle by centralizing common fetch patterns
 */

export interface FetchOptions extends RequestInit {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 2) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Whether to parse JSON response automatically (default: true) */
  parseJson?: boolean;
}

export interface FetchResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Enhanced fetch with retry logic and standardized error handling
 */
export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResponse<T>> {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    parseJson = true,
    ...fetchOptions
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        if (!response.ok) {
          // Attempt to read server error body for meaningful message
          let enhancedMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const rawText = await response.text();
            if (rawText) {
              try {
                const maybeJson = JSON.parse(rawText) as {
                  success?: boolean;
                  error?: { message?: string; details?: string };
                  message?: string;
                  details?: string;
                };
                const bodyMsg =
                  maybeJson?.error?.message || maybeJson?.message || '';
                const bodyDetails =
                  maybeJson?.error?.details || maybeJson?.details || '';
                const tail = [bodyMsg, bodyDetails]
                  .filter(Boolean)
                  .join(' - ')
                  .trim();
                if (tail) enhancedMessage = `${enhancedMessage} - ${tail}`;
              } catch {
                // Not JSON; include raw text truncated
                const trimmed = rawText.trim();
                if (trimmed) {
                  enhancedMessage = `${enhancedMessage} - ${trimmed.slice(0, 200)}`;
                }
              }
            }
          } catch {
            // Ignore body parse failures; keep base message
          }
          throw new FetchError(
            enhancedMessage,
            response.status,
            response.statusText,
            url,
          );
        }

        const data = parseJson ? await response.json() : await response.text();

        return {
          data: data as T,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        error instanceof FetchError &&
        (error.status === 400 ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 404)
      ) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError!;
}

/**
 * Custom error class for fetch operations
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public url: string,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Helper for GET requests
 */
export async function get<T = unknown>(
  url: string,
  options?: Omit<FetchOptions, 'method' | 'body'>,
): Promise<FetchResponse<T>> {
  return fetchWithRetry<T>(url, { ...options, method: 'GET' });
}

/**
 * Helper for POST requests
 */
export async function post<T = unknown>(
  url: string,
  body?: unknown,
  options?: Omit<FetchOptions, 'method' | 'body'>,
): Promise<FetchResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  return fetchWithRetry<T>(url, {
    ...options,
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : null,
  });
}

/**
 * Helper for external API requests with smart content-type detection
 */
export async function fetchExternal<T = unknown>(
  url: string,
  options?: FetchOptions,
): Promise<FetchResponse<T>> {
  const { parseJson = true, ...otherOptions } = options || {};
  return fetchWithRetry<T>(url, { ...otherOptions, parseJson });
}
