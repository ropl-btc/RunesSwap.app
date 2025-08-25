import { fetchRuneInfoFromApi } from '@/lib/api';
import { useRuneDataQuery } from '@/hooks/useRuneDataQuery';

interface UseRuneInfoOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

/**
 * Hook for fetching rune information
 */
export function useRuneInfo(
  runeName: string | null | undefined,
  options: UseRuneInfoOptions = {},
) {
  return useRuneDataQuery('runeInfo', runeName, fetchRuneInfoFromApi, {
    staleTime: Infinity,
    retry: 2,
    ...options,
  });
}
