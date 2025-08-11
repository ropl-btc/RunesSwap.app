import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
} from '@/lib/apiUtils';
import {
  cachePopularRunes,
  getCachedPopularRunes,
  isFallbackPopularRunesData,
  updateLastRefreshAttempt,
} from '@/lib/popularRunesCache';
import { getSatsTerminalClient } from '@/lib/serverUtils';

// Simple in-memory guard to prevent spamming SatsTerminal in dev when
// Supabase cache is empty/unavailable. This complements DB throttling.
let inMemoryLastAttemptAt: number | null = null;
let inMemoryInFlight: Promise<void> | null = null;
// Minimum interval between upstream refresh attempts when only fallback exists
// Longer in development to avoid rate limits during HMR/StrictMode remounts.
const IN_MEMORY_MIN_REFRESH_MS =
  process.env.NODE_ENV === 'development' ? 15 * 60 * 1000 : 5 * 60 * 1000;

/**
 * Optimized popular runes endpoint with improved caching strategy
 * - Always returns cached data when available
 * - Only attempts to refresh cache after a reasonable backoff period
 * - Refreshes cache in the background without blocking the response
 * - Uses a hardcoded fallback list when API is completely unreachable
 */
export async function GET() {
  try {
    // Get cached data with detailed metadata
    const { data, isExpired, isStale, lastRefreshAttempt } =
      await getCachedPopularRunes();

    // CRITICAL: We ALWAYS return cached data immediately when available
    // Even if it's expired, we use the stale-while-revalidate pattern
    // However, if we only have fallback data, we should fetch fresh data synchronously
    const fb = isFallbackPopularRunesData(
      data as unknown,
      lastRefreshAttempt,
    ) as unknown;
    const isFallbackData =
      typeof fb === 'boolean'
        ? fb
        : Array.isArray(data) &&
          lastRefreshAttempt === null &&
          data.some(
            (item: Record<string, unknown>) =>
              item?.id === 'liquidiumtoken' || item?.id === 'ordinals_ethtoken',
          );
    if (data && Array.isArray(data) && data.length > 0 && !isFallbackData) {
      // If cache is not completely stale and we should attempt to refresh,
      // start a background refresh without awaiting the result
      if (!isStale && isExpired) {
        // Update the last refresh attempt timestamp immediately
        // This prevents multiple concurrent refresh attempts
        updateLastRefreshAttempt().catch(console.error);

        // Start background refresh without awaiting or blocking
        refreshPopularRunesInBackground().catch((error) => {
          console.warn('Background refresh of popular runes failed:', error);
        });
      }

      // Return the cached data with a flag indicating if it's stale
      return createSuccessResponse({
        data,
        isStale: isExpired,
        cacheAge: lastRefreshAttempt
          ? new Date(lastRefreshAttempt).toISOString()
          : null,
      });
    }

    // If we have no cached data at all (first run), we need to fetch
    // synchronously — but guard with in-memory throttling to avoid bursts.
    if (!data || !Array.isArray(data) || data.length === 0 || isFallbackData) {
      const now = Date.now();
      const tooSoon =
        inMemoryLastAttemptAt !== null &&
        now - inMemoryLastAttemptAt < IN_MEMORY_MIN_REFRESH_MS;

      // If we recently attempted or another request is in flight, skip
      // upstream call and return whatever cache/fallback we have.
      if (tooSoon || inMemoryInFlight) {
        return createSuccessResponse({
          data,
          isStale: true,
          cacheAge: lastRefreshAttempt
            ? new Date(lastRefreshAttempt).toISOString()
            : null,
          skippedRefresh: true,
        });
      }

      try {
        inMemoryLastAttemptAt = now;
        const terminal = getSatsTerminalClient();
        const doFetch = async () => {
          const resp = await terminal.popularTokens({});
          return resp;
        };
        const promise = doFetch();
        inMemoryInFlight = promise.then(
          () => {
            inMemoryInFlight = null;
          },
          () => {
            inMemoryInFlight = null;
          },
        ) as unknown as Promise<void>;
        const popularResponse = await promise;

        // Validate response
        if (!popularResponse || typeof popularResponse !== 'object') {
          throw new Error('Invalid response from SatsTerminal API');
        }

        // Cache the fresh data and return it
        if (Array.isArray(popularResponse)) {
          await cachePopularRunes(popularResponse);
          return createSuccessResponse(popularResponse);
        }
        throw new Error('Unexpected response format from SatsTerminal API');
      } catch (error) {
        // Something went wrong, but we have fallbacks in the cache module
        const { data: fallbackData } = await getCachedPopularRunes();

        // Log the error but return whatever we have (which would be at least the fallback list)
        console.error('Failed to fetch initial popular runes:', error);
        return createSuccessResponse({
          data: fallbackData,
          isStale: true,
          error: 'Failed to fetch fresh data',
        });
      }
    }

    // Fallback: return the cached payload shape (should be unreachable)
    return createSuccessResponse({
      data,
      isStale: isExpired,
      cacheAge: lastRefreshAttempt
        ? new Date(lastRefreshAttempt).toISOString()
        : null,
    });
  } catch (error) {
    const errorInfo = handleApiError(
      error,
      'Failed to fetch cached popular collections',
    );
    return createErrorResponse(
      errorInfo.message,
      errorInfo.details,
      errorInfo.status,
    );
  }
}

/**
 * Function to refresh popular runes data in the background
 * This is called without awaiting the result to prevent blocking the response
 */
async function refreshPopularRunesInBackground(): Promise<void> {
  try {
    const now = Date.now();
    if (
      inMemoryInFlight ||
      (inMemoryLastAttemptAt !== null &&
        now - inMemoryLastAttemptAt < IN_MEMORY_MIN_REFRESH_MS)
    ) {
      return;
    }
    inMemoryLastAttemptAt = now;
    const terminal = getSatsTerminalClient();
    const doFetch = async () => terminal.popularTokens({});
    const promise = doFetch();
    inMemoryInFlight = promise.then(
      () => {
        inMemoryInFlight = null;
      },
      () => {
        inMemoryInFlight = null;
      },
    ) as unknown as Promise<void>;
    const popularResponse = await promise;

    // Validate and cache if valid
    if (
      popularResponse &&
      typeof popularResponse === 'object' &&
      Array.isArray(popularResponse)
    ) {
      await cachePopularRunes(popularResponse);
    } else {
      console.warn('Invalid response format from SatsTerminal API');
    }
  } catch (error) {
    console.error('Failed to refresh popular runes in background:', error);
    // The error is caught and logged, but never thrown, so it doesn't affect the user experience
  }
}
