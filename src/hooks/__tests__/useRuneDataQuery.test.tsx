import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useRuneDataQuery } from '@/hooks/useRuneDataQuery';

it('waits for a rune and shares cached data across equivalent names', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const fetcher = jest.fn().mockResolvedValue({ name: 'DOG' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    ({ rune }: { rune: string | null }) => useRuneDataQuery('runeInfo', rune, fetcher),
    { initialProps: { rune: null } as { rune: string | null }, wrapper },
  );
  expect(fetcher).not.toHaveBeenCalled();
  hook.rerender({ rune: 'dog' });
  await waitFor(() => expect(hook.result.current.data).toEqual({ name: 'DOG' }));
  hook.rerender({ rune: 'DOG' });
  expect(hook.result.current.data).toEqual({ name: 'DOG' });
  expect(fetcher).toHaveBeenCalledTimes(1);
  hook.unmount();
  client.clear();
});
