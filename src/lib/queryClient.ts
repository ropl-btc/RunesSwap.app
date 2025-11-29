import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance with sensible defaults for server state management.
 * Configured with:
 * - 30s stale time
 * - 5m cache time
 * - 2 retries for queries
 * - No retries for mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000, // 30s
      gcTime: 300_000, // 5m
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Avoid auto-retry by default on mutations (often non-idempotent)
      retry: 0,
    },
  },
});
