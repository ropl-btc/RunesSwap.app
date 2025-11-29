import { useApiQuery } from '@/hooks/useApiQuery';

interface UseRuneDataOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

/**
 * Generic hook for fetching rune-related data.
 * Wraps useApiQuery with specific configuration for rune data.
 *
 * @param queryKey - The key for the query.
 * @param runeName - The name of the rune to fetch data for.
 * @param fetcher - The function to fetch the data.
 * @param options - Options for the query (enabled, staleTime, retry).
 * @returns The query result.
 */
export function useRuneDataQuery<T>(
  queryKey: string,
  runeName: string | null | undefined,
  fetcher: (rune: string) => Promise<T | null>,
  options: UseRuneDataOptions = {},
) {
  const { enabled = !!runeName, staleTime, retry } = options;
  const config: { enabled: boolean; retry?: number } = { enabled };
  if (retry !== undefined) {
    config.retry = retry;
  }

  return useApiQuery(queryKey, runeName, fetcher, staleTime, config);
}
