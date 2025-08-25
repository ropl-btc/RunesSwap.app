import { useApiQuery } from '@/hooks/useApiQuery';

interface UseRuneDataOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
}

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
