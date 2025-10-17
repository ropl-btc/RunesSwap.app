import { QueryClient } from '@tanstack/react-query';

// Shared QueryClient instance with sensible defaults for server state
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
