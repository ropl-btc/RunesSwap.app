import { useQuery } from '@tanstack/react-query';
import { fetchRuneInfoFromApi } from '@/lib/api';

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
  const { enabled = !!runeName, staleTime = Infinity, retry = 2 } = options;

  return useQuery({
    queryKey: ['runeInfo', runeName?.toUpperCase() || ''],
    queryFn: () =>
      runeName ? fetchRuneInfoFromApi(runeName) : Promise.resolve(null),
    enabled: enabled && !!runeName,
    staleTime,
    retry,
  });
}
