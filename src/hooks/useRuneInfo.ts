import { useQuery } from '@tanstack/react-query';
import { fetchRuneInfoFromApi } from '@/lib/api';
import type { RuneData } from '@/lib/runesData';

interface UseRuneInfoOptions {
  /**
   * Whether to enable the query
   * @default true when runeName is provided
   */
  enabled?: boolean;
  /**
   * Query stale time
   * @default Infinity (rune info rarely changes)
   */
  staleTime?: number;
  /**
   * Number of retries on error
   * @default 2
   */
  retry?: number;
}

/**
 * Shared hook for fetching rune information
 * @param runeName - The name of the rune to fetch info for
 * @param options - Additional query options
 * @returns React Query result with rune data
 */
export function useRuneInfo(
  runeName: string | null | undefined,
  options: UseRuneInfoOptions = {},
) {
  const { enabled, staleTime = Infinity, retry = 2 } = options;

  return useQuery<RuneData | null, Error>({
    queryKey: ['runeInfoApi', (runeName || '').toUpperCase()],
    queryFn: () =>
      runeName ? fetchRuneInfoFromApi(runeName) : Promise.resolve(null),
    enabled: enabled !== undefined ? enabled : !!runeName,
    staleTime,
    retry,
  });
}
