import { useQuery } from '@tanstack/react-query';

/**
 * Minimal wrapper for API queries with string parameters
 */
export function useApiQuery<TData>(
  queryKey: string,
  parameter: string | null | undefined,
  queryFn: (param: string) => Promise<TData | null>,
  staleTime = Infinity,
  options: { enabled?: boolean; retry?: number } = {},
) {
  const { enabled = !!parameter, retry } = options;
  return useQuery({
    queryKey: [queryKey, parameter?.toUpperCase() || ''],
    queryFn: () => (parameter ? queryFn(parameter) : Promise.resolve(null)),
    enabled,
    staleTime,
    ...(retry !== undefined ? { retry } : {}),
  });
}
