import { useQuery } from '@tanstack/react-query';

export function useRuneDataQuery<T>(
  queryKey: string,
  runeName: string | null | undefined,
  fetcher: (rune: string) => Promise<T | null>,
  options: { enabled?: boolean; staleTime?: number; retry?: number } = {},
) {
  return useQuery({
    queryKey: [queryKey, runeName?.toUpperCase() || ''],
    queryFn: () => (runeName ? fetcher(runeName) : Promise.resolve(null)),
    enabled: !!runeName,
    staleTime: Infinity,
    ...options,
  });
}
